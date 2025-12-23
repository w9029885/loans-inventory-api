import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo } from '../config/appServices';
import { updateDeviceUseCase } from '../app/update-device';

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
    try {
      const id = (request as any)?.params?.id as string | undefined;
      if (!id || typeof id !== 'string' || id.trim() === '') {
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
          return errorResponse(
            400,
            'invalid_name',
            'name must be a non-empty string'
          );
        }
      }
      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === '') {
          return errorResponse(
            400,
            'invalid_description',
            'description must be a non-empty string'
          );
        }
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

      if (
        name === undefined &&
        description === undefined &&
        count === undefined
      ) {
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
        return errorResponse(404, 'not_found', 'Device not found');
      }

      return {
        status: 200,
        jsonBody: {
          data: serializeDevice(updated),
        },
      };
    } catch (err: any) {
      context.error('Unhandled error in update-device-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
