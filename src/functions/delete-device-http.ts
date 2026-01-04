import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo, getOAuth2Validator, resolveAuthContext } from '../config/appServices';
import { deleteDeviceUseCase } from '../app/delete-device';
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

app.http('delete-device-http', {
  methods: ['DELETE'],
  route: 'devices/{id}',
  authLevel: 'anonymous',
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const logger = createLogger(context);
    const correlationId =
      request.headers.get('x-correlation-id') ||
      (context.traceContext?.traceparent as string | undefined);

    try {
      const authContext = await resolveAuthContext(request);
      const validator = getOAuth2Validator();
      const canWrite = validator
        ? validator.hasScope(authContext, 'write:devices') ||
          validator.hasRole(authContext, 'staff')
        : true;

      logger.info('Delete device request received', {
        correlationId,
        subject: authContext.subject,
        roles: authContext.roles,
        scopes: authContext.scopes,
        canWrite,
      });

      if (validator && !authContext.authenticated) {
        logger.warn('Unauthenticated delete-device attempt', { correlationId });
        return errorResponse(401, 'unauthorized', 'Sign in is required');
      }
      if (validator && !canWrite) {
        logger.warn('Forbidden delete-device attempt', { correlationId });
        return errorResponse(403, 'forbidden', 'Staff access is required');
      }

      const id = (request as any)?.params?.id as string | undefined;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        logger.warn('Missing id in delete-device route', { correlationId });
        return errorResponse(
          400,
          'invalid_id',
          'id must be provided in the route'
        );
      }

      const repo = getDeviceRepo();
      const deleted = await deleteDeviceUseCase({ deviceRepo: repo }, { id });

      if (!deleted) {
        logger.warn('Device not found for delete', { correlationId, id });
        return errorResponse(404, 'not_found', 'Device not found');
      }

      logger.info('Device deleted', { correlationId, id });

      return {
        status: 204,
      };
    } catch (err: any) {
      logger.error('Unhandled error in delete-device-http', {
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
