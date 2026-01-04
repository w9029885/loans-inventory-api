import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo, getOAuth2Validator, resolveAuthContext } from '../config/appServices';
import { createDeviceUseCase } from '../app/create-device';
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

app.http('create-device-http', {
  methods: ['POST'],
  route: 'devices',
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
      if (request.method !== 'POST') {
        logger.warn('Rejected non-POST method for create device', {
          method: request.method,
          correlationId,
        });
        return errorResponse(
          405,
          'method_not_allowed',
          'Only POST is supported'
        );
      }

      const authContext = await resolveAuthContext(request);
      const validator = getOAuth2Validator();
      const canWrite = validator
        ? validator.hasScope(authContext, 'write:devices') ||
          validator.hasRole(authContext, 'staff')
        : true;

      logger.info('Create device request received', {
        correlationId,
        subject: authContext.subject,
        roles: authContext.roles,
        scopes: authContext.scopes,
        canWrite,
      });

      if (validator && !authContext.authenticated) {
        logger.warn('Unauthenticated create-device attempt', { correlationId });
        return errorResponse(401, 'unauthorized', 'Sign in is required');
      }
      if (validator && !canWrite) {
        logger.warn('Forbidden create-device attempt', { correlationId });
        return errorResponse(403, 'forbidden', 'Staff access is required');
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        logger.warn('Invalid JSON body for create device', { correlationId });
        return errorResponse(
          400,
          'invalid_json',
          'Request body must be valid JSON'
        );
      }

      const name = body?.name;
      const description = body?.description;
      const count = body?.count as number | undefined;
      const id = body?.id as string | undefined;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        logger.warn('Invalid name in create device', { correlationId });
        return errorResponse(
          400,
          'invalid_name',
          'name must be a non-empty string'
        );
      }
      if (
        !description ||
        typeof description !== 'string' ||
        description.trim() === ''
      ) {
        logger.warn('Invalid description in create device', { correlationId });
        return errorResponse(
          400,
          'invalid_description',
          'description must be a non-empty string'
        );
      }
      if (count !== undefined) {
        if (!Number.isFinite(count) || count < 0) {
          logger.warn('Invalid count in create device', {
            correlationId,
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

      const repo = getDeviceRepo();

      if (id && (typeof id !== 'string' || id.trim() === '')) {
        logger.warn('Invalid id supplied for create device', { correlationId });
        return errorResponse(
          400,
          'invalid_id',
          'id, if provided, must be a non-empty string'
        );
      }

      if (id) {
        const existing = await repo.getById(id);
        if (existing) {
          logger.warn('Duplicate id detected on create device', {
            correlationId,
            id,
          });
          return errorResponse(
            409,
            'device_exists',
            'A device with this id already exists'
          );
        }
      }

      const created = await createDeviceUseCase(
        { deviceRepo: repo },
        { id, name, description, count }
      );

      logger.info('Device created', {
        correlationId,
        id: created.id,
        name: created.name,
        count: created.count,
      });

      return {
        status: 201,
        jsonBody: {
          data: serializeDevice(created),
        },
      };
    } catch (err: any) {
      logger.error('Unhandled error in create-device-http', {
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
