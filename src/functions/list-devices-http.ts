import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo, getOAuth2Validator, resolveAuthContext } from '../config/appServices';
import { listDevices } from '../app/list-devices';

// Unified error response shape
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

// Serialize domain devices to plain JSON (Dates -> ISO strings)
const serializeDevices = (devices: any[], includeCounts: boolean) =>
  devices.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    count: includeCounts ? d.count : undefined,
    updatedAt:
      d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
  }));

app.http('list-devices-http', {
  methods: ['GET'],
  route: 'devices',
  authLevel: 'anonymous',
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      // Basic method guard (should always be GET due to definition)
      if (request.method !== 'GET') {
        return errorResponse(
          405,
          'method_not_allowed',
          'Only GET is supported'
        );
      }

      // Optional query param: limit (for simple 400 example)
      const limitRaw = request.query.get('limit');
      let limit: number | undefined;
      if (limitRaw !== null) {
        limit = Number(limitRaw);
        if (!Number.isFinite(limit) || limit <= 0) {
          return errorResponse(
            400,
            'invalid_limit',
            'limit must be a positive number'
          );
        }
      }

      const authContext = await resolveAuthContext(request);
      const validator = getOAuth2Validator();
      const canSeeCounts = validator
        ? validator.hasScope(authContext, 'read:devices') ||
          validator.hasScope(authContext, 'write:devices') ||
          validator.hasRole(authContext, 'student') ||
          validator.hasRole(authContext, 'staff')
        : authContext.authenticated;

      const repo = getDeviceRepo();
      const devices = await listDevices({ deviceRepo: repo });
      const sliced =
        typeof limit === 'number' ? devices.slice(0, limit) : devices;

      return {
        status: 200,
        jsonBody: {
          data: serializeDevices(sliced, canSeeCounts),
          count: sliced.length,
        },
      };
    } catch (err: any) {
      context.error('Unhandled error in list-devices-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
