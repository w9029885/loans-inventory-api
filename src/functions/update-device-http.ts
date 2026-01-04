import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo, getOAuth2Validator, resolveAuthContext } from '../config/appServices';
import { updateDeviceUseCase } from '../app/update-device';
import { createLogger } from '../app/logger';

const errorResponse = (
  status: number,
  code: string,
  message: string
): HttpResponseInit => ({
  status,
  jsonBody: {
    error: { code, message },
  },
});

const serializeDevice = (d: any) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  count: d.count,
  updatedAt:
    d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
});

app.http('update-device-http', {
  methods: ['PATCH'],
  route: 'devices/{id}',
  authLevel: 'anonymous',
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const logger = createLogger(context);
    const correlationId =
      request.headers.get('x-correlation-id') ||
      (context.traceContext?.traceParent as string | undefined);

    try {
      const authContext = await resolveAuthContext(request);
      const validator = getOAuth2Validator();
      const canWrite = validator
        ? validator.hasScope(authContext, 'write:devices') ||
          validator.hasRole(authContext, 'staff')
        : true;

      logger.info('Update device request received', {
        correlationId,
        subject: authContext.subject,
        roles: authContext.roles,
        scopes: authContext.scopes,
        canWrite,
      });

      if (validator && !authContext.authenticated) {
        logger.warn('Unauthenticated update-device attempt', { correlationId });
        return errorResponse(401, 'unauthorized', 'Sign in is required');
      }
      if (validator && !canWrite) {
        logger.warn('Forbidden update-device attempt', { correlationId });
        return errorResponse(403, 'forbidden', 'Staff access is required');
      }

      const id = (request as any)?.params?.id as string | undefined;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        logger.warn('Missing id in update-device route', { correlationId });
        return errorResponse(
          400,
          'invalid_id',
          'id must be provided in the route'
        );
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        logger.warn('Invalid JSON body for update device', { correlationId });
        return errorResponse(
          400,
          'invalid_json',
          'Request body must be valid JSON'
        );
      }

      const name = body?.name as string | undefined;
      const description = body?.description as string | undefined;
      const count = body?.count as number | undefined;

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          logger.warn('Invalid name in update device', { correlationId, id });
          return errorResponse(
            400,
            'invalid_name',
            'name must be a non-empty string'
          );
        }
      }
      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === '') {
          logger.warn('Invalid description in update device', {
            correlationId,
            id,
          });
          return errorResponse(
            400,
            'invalid_description',
            'description must be a non-empty string'
          );
        }
      }
      if (count !== undefined) {
        if (!Number.isFinite(count) || count < 0) {
          logger.warn('Invalid count in update device', {
            correlationId,
            id,
            count,
          });
          return errorResponse(
            400,
            'invalid_count',
            'count must be a number greater than or equal to 0'
          );
        }
        if (!Number.isInteger(count)) {
          return errorResponse(
            400,
            'invalid_count',
            'count must be an integer'
          );
        }
      }

      if (
        name === undefined &&
        description === undefined &&
        count === undefined
      ) {
        logger.warn('No update fields provided', { correlationId, id });
        return errorResponse(
          400,
          'no_fields',
          'Provide at least one of: name, description, count'
        );
      }

      const repo = getDeviceRepo();
      const updated = await updateDeviceUseCase(
        { deviceRepo: repo },
        { id, name, description, count }
      );

      if (!updated) {
        logger.warn('Device not found for update', { correlationId, id });
        return errorResponse(404, 'not_found', 'Device not found');
      }

      logger.info('Device updated', {
        correlationId,
        id,
        name: updated.name,
        count: updated.count,
      });

      return {
        status: 200,
        jsonBody: {
          data: serializeDevice(updated),
        },
      };
    } catch (err: any) {
      logger.error('Unhandled error in update-device-http', {
        correlationId,
        error: err?.message,
      });
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
