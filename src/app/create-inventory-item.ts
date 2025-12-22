import {
  createInventoryItem,
  InventoryItem,
  InventoryItemStatus,
} from '../domain/inventory-item';
import { InventoryItemRepo } from '../domain/inventory-item-repo';

export type CreateInventoryItemDeps = {
  inventoryItemRepo: InventoryItemRepo;
  /** Optional id generator for testability */
  generateId?: () => string;
  /** Optional clock for testability */
  now?: () => Date;
};

export type CreateInventoryItemCommand = {
  name: string;
  description: string;
  status?: InventoryItemStatus;
  /**
   * Optional explicit id. If omitted, an id will be generated.
   * Callers should ensure uniqueness if they provide this.
   */
  id?: string;
};

const defaultId = (): string => {
  const ts = new Date()
    .toISOString()
    .replace(/[-:TZ\.]/g, '')
    .slice(0, 14); // yyyyMMddHHmmss
  const rand = Math.random().toString(36).slice(2, 8);
  return `item-${ts}-${rand}`;
};

export const createInventoryItemUseCase = async (
  deps: CreateInventoryItemDeps,
  cmd: CreateInventoryItemCommand
): Promise<InventoryItem> => {
  const id = cmd.id || deps.generateId?.() || defaultId();
  const now = deps.now?.() || new Date();
  const status: InventoryItemStatus = cmd.status || 'available';

  const entity = createInventoryItem({
    id,
    name: cmd.name,
    description: cmd.description,
    status,
    updatedAt: now,
  });

  return deps.inventoryItemRepo.save(entity);
};
