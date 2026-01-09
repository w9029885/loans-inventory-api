import { app, InvocationContext } from '@azure/functions';
import { createLogger } from '../app/logger';
import { getDeviceRepo, getProcessedEventRepo } from '../config/appServices';
import { applyDeviceCountDeltaUseCase } from '../app/apply-device-count-delta';

type ReservationStatusEventData = {
  reservationId: string;
  deviceModelId: string;
  newStatus: 'collected' | 'returned';
  occurredAt?: string;
};

type CloudEventLike = {
  id: string;
  type: string;
  subject?: string;
  time?: string;
  data: ReservationStatusEventData;
};

const toArray = (evt: unknown): CloudEventLike[] => {
  if (Array.isArray(evt)) return evt as CloudEventLike[];
  if (evt && typeof evt === 'object') return [evt as CloudEventLike];
  return [];
};

app.eventGrid('reservation-status-eventgrid', {
  handler: async (event: unknown, context: InvocationContext): Promise<void> => {
    const logger = createLogger(context);
    const events = toArray(event);

    if (events.length === 0) {
      logger.warn('Event Grid trigger received no events');
      return;
    }

    const deviceRepo = getDeviceRepo();
    const processedRepo = getProcessedEventRepo();

    for (const evt of events) {
      const eventId = evt?.id;
      const eventType = evt?.type;

      if (!eventId || !eventType) {
        logger.warn('Skipping malformed event', { eventId, eventType });
        continue;
      }

      // Only handle the events we care about
      if (eventType !== 'reservation.collected' && eventType !== 'reservation.returned') {
        logger.info('Ignoring unrelated event type', { eventId, eventType });
        continue;
      }

      const alreadyProcessed = await processedRepo.has(eventId);
      if (alreadyProcessed) {
        logger.info('Skipping already-processed event', { eventId, eventType });
        continue;
      }

      const data = evt.data;
      if (!data?.deviceModelId || !data?.reservationId || !data?.newStatus) {
        logger.warn('Skipping event with missing data fields', {
          eventId,
          eventType,
          subject: evt.subject,
        });
        continue;
      }

      const delta = eventType === 'reservation.collected' ? -1 : 1;

      logger.info('Applying availability delta from reservation event', {
        eventId,
        eventType,
        reservationId: data.reservationId,
        deviceModelId: data.deviceModelId,
        delta,
      });

      const result = await applyDeviceCountDeltaUseCase(
        { deviceRepo },
        { deviceId: data.deviceModelId, delta }
      );

      if (result.success === false) {
        logger.error('Failed to apply availability delta', {
          eventId,
          eventType,
          error: result.error,
          message: result.message,
        });
        // Throw to allow Event Grid retry (at-least-once delivery)
        throw new Error(result.message);
      }

      await processedRepo.markProcessed({
        id: eventId,
        processedAt: new Date(),
        type: eventType,
        subject: evt.subject,
      });

      logger.info('Reservation event processed', {
        eventId,
        eventType,
        deviceModelId: data.deviceModelId,
        newCount: result.device.count,
      });
    }
  },
});
