import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo } from '../config/appServices';
import { createDeviceUseCase } from '../app/create-device';

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
    try {
      if (request.method !== 'POST') {
        return errorResponse(
          405,
          'method_not_allowed',
          'Only POST is supported'
        );
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
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
        return errorResponse(
          400,
          'invalid_description',
          'description must be a non-empty string'
        );
      }
      if (count !== undefined) {
        if (!Number.isFinite(count) || count < 0) {
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
        return errorResponse(
          400,
          'invalid_id',
          'id, if provided, must be a non-empty string'
        );
      }

      if (id) {
        const existing = await repo.getById(id);
        if (existing) {
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

      return {
        status: 201,
        jsonBody: {
          data: serializeDevice(created),
        },
      };
    } catch (err: any) {
      context.error('Unhandled error in create-device-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
