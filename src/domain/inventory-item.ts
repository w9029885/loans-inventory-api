export type InventoryItemStatus = 'available' | 'reserved' | 'loaned';

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  status: InventoryItemStatus;
  updatedAt: Date;
};

export type CreateInventoryItemParams = {
  id: string;
  name: string;
  description: string;
  status: InventoryItemStatus;
  updatedAt: Date;
};

export class InventoryItemError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'InventoryItemError';
  }
}

const validateInventoryItem = (params: CreateInventoryItemParams): void => {
  if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
    throw new InventoryItemError(
      'id',
      'Inventory item id must be a non-empty string.'
    );
  }
  if (
    !params.name ||
    typeof params.name !== 'string' ||
    params.name.trim() === ''
  ) {
    throw new InventoryItemError(
      'name',
      'Inventory item name must be a non-empty string.'
    );
  }
  if (
    typeof params.status !== 'string' ||
    !['available', 'reserved', 'loaned'].includes(params.status)
  ) {
    throw new InventoryItemError(
      'status',
      'Inventory item status must be one of: available, reserved, loaned.'
    );
  }
  if (
    !params.description ||
    typeof params.description !== 'string' ||
    params.description.trim() === ''
  ) {
    throw new InventoryItemError(
      'description',
      'Inventory item description must be a non-empty string.'
    );
  }
  if (
    !(params.updatedAt instanceof Date) ||
    isNaN(params.updatedAt.getTime())
  ) {
    throw new InventoryItemError(
      'updatedAt',
      'updatedAt must be a valid Date object.'
    );
  }
};

export const createInventoryItem = (
  params: CreateInventoryItemParams
): InventoryItem => {
  validateInventoryItem(params);

  return {
    id: params.id,
    name: params.name,
    status: params.status,
    description: params.description,
    updatedAt: params.updatedAt,
  };
};
