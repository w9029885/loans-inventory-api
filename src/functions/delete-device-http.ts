import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceRepo, getOAuth2Validator, resolveAuthContext } from '../config/appServices';
import { deleteDeviceUseCase } from '../app/delete-device';

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
    try {
      const authContext = await resolveAuthContext(request);
      const validator = getOAuth2Validator();
      const canWrite = validator
        ? validator.hasScope(authContext, 'write:devices') ||
          validator.hasRole(authContext, 'staff')
        : true;

      if (validator && !authContext.authenticated) {
        return errorResponse(401, 'unauthorized', 'Sign in is required');
      }
      if (validator && !canWrite) {
        return errorResponse(403, 'forbidden', 'Staff access is required');
      }

      const id = (request as any)?.params?.id as string | undefined;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return errorResponse(
          400,
          'invalid_id',
          'id must be provided in the route'
        );
      }

      const repo = getDeviceRepo();
      const deleted = await deleteDeviceUseCase({ deviceRepo: repo }, { id });

      if (!deleted) {
        return errorResponse(404, 'not_found', 'Device not found');
      }

      return {
        status: 204,
      };
    } catch (err: any) {
      context.error('Unhandled error in delete-device-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
