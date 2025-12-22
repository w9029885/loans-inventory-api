import { InventoryItem } from './inventory-item';

/**
 * Repository interface for persisting and retrieving InventoryItem entities.
 * Implementations should map these methods to whatever backing store is used
 * (in-memory, database, external service, etc.).
 */
export interface InventoryItemRepo {
  /**
   * Fetch an inventory item by id. Returns null if not found.
   */
  getById(id: string): Promise<InventoryItem | null>;

  /**
   * List all inventory items. Implementations may choose to add pagination later.
   */
  list(): Promise<InventoryItem[]>;

  /**
   * Save an inventory item (create or update / upsert).
   * Implementations should insert the inventory item if it does not exist, or
   * update the existing record if it does. Return the saved InventoryItem (which
   * may include store-generated fields or normalized values).
   */
  save(item: InventoryItem): Promise<InventoryItem>;

  /**
   * Remove an inventory item by id. No-op if the inventory item does not exist.
   */
  delete(id: string): Promise<void>;
}
