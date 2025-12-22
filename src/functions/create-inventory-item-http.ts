import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getInventoryItemRepo } from '../config/appServices';
import { createInventoryItemUseCase } from '../app/create-inventory-item';
import { InventoryItemStatus } from '../domain/inventory-item';

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

const serializeItem = (i: any) => ({
  id: i.id,
  name: i.name,
  description: i.description,
  status: i.status,
  updatedAt:
    i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt,
});

const isValidStatus = (s: any): s is InventoryItemStatus =>
  s === 'available' || s === 'reserved' || s === 'loaned';

app.http('create-inventory-item-http', {
  methods: ['POST'],
  route: 'inventory-items',
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
      const status = body?.status as InventoryItemStatus | undefined;
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
      if (status !== undefined && !isValidStatus(status)) {
        return errorResponse(
          400,
          'invalid_status',
          'status must be one of: available, reserved, loaned'
        );
      }

      const repo = getInventoryItemRepo();

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
            'item_exists',
            'An inventory item with this id already exists'
          );
        }
      }

      const created = await createInventoryItemUseCase(
        { inventoryItemRepo: repo },
        { id, name, description, status }
      );

      return {
        status: 201,
        jsonBody: {
          data: serializeItem(created),
        },
      };
    } catch (err: any) {
      context.error('Unhandled error in create-inventory-item-http', err);
      return errorResponse(
        500,
        'internal_error',
        'An unexpected error occurred'
      );
    }
  },
});
