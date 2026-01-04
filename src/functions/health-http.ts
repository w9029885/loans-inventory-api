import { app, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDeviceRepo } from '../config/appServices';
import { createLogger } from '../app/logger';

app.http('health-http', {
  methods: ['GET'],
  route: 'health',
  authLevel: 'anonymous',
  handler: async (_request, context: InvocationContext): Promise<HttpResponseInit> => {
    const logger = createLogger(context);
    const started = Date.now();

    const useFakeRepo = process.env.USE_FAKE_REPO === 'true';
    let storageStatus: 'ok' | 'degraded' = 'ok';
    let status = 200;

    try {
      const repo = getDeviceRepo();
      // Lightweight probe to confirm repository is reachable
      await repo.list();
    } catch (err: any) {
      storageStatus = 'degraded';
      status = 503;
      logger.warn('Health check failed to reach device repository', {
        error: err?.message,
      });
    }

    const durationMs = Date.now() - started;
    const payload = {
      status: storageStatus === 'ok' ? 'ok' : 'degraded',
      storageStatus,
      useFakeRepo,
      timestamp: new Date().toISOString(),
      durationMs,
    } as const;

    logger.info('Health check completed', payload);

    return {
      status,
      jsonBody: payload,
    };
  },
});
