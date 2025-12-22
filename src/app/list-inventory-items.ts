import { InventoryItem } from '../domain/inventory-item';
import { InventoryItemRepo } from '../domain/inventory-item-repo';

// Dependencies container for the use case (single-parameter deps pattern)
export type ListInventoryItemsDeps = {
  inventoryItemRepo: InventoryItemRepo;
};

// Application-layer use case: list inventory items.
// Thin and pure – delegates directly to the repository.
export const listInventoryItems = async (
  deps: ListInventoryItemsDeps
): Promise<InventoryItem[]> => {
  return deps.inventoryItemRepo.list();
};
