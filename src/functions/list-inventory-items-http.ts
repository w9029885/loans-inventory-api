import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getInventoryItemRepo } from '../config/appServices';
import { listInventoryItems } from '../app/list-inventory-items';

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

// Serialize domain items to plain JSON (Dates -> ISO strings)
const serializeItems = (items: any[]) =>
  items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    status: i.status,
    updatedAt:
      i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt,
  }));

app.http('list-inventory-items-http', {
  methods: ['GET'],
  route: 'inventory-items',
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

      const repo = getInventoryItemRepo();
      const items = await listInventoryItems({ inventoryItemRepo: repo });
      const sliced = typeof limit === 'number' ? items.slice(0, limit) : items;
      return {
        status: 200,
        jsonBody: {
          data: serializeItems(sliced),
          count: sliced.length,
        },
      };
    } catch (err: any) {
      context.error('Unhandled error in list-inventory-items-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
