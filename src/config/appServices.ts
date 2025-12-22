import { CosmosInventoryItemRepo } from '../infra/cosmos-inventory-item-repo';
import { InventoryItemRepo } from '../domain/inventory-item-repo';

// Read configuration from environment variables
// Required: COSMOS_ENDPOINT, COSMOS_DATABASE_ID, COSMOS_CONTAINER_ID, COSMOS_KEY
// Optional: COSMOS_PARTITION_KEY (defaults to 'id')
const PARTITION_KEY = process.env.COSMOS_PARTITION_KEY || 'id';

let inventoryItemRepoSingleton: InventoryItemRepo | null = null;

export const getInventoryItemRepo = (): InventoryItemRepo => {
  if (inventoryItemRepoSingleton) return inventoryItemRepoSingleton;

  const endpoint = process.env.COSMOS_ENDPOINT;
  const databaseId = process.env.COSMOS_DATABASE_ID;
  const containerId = process.env.COSMOS_CONTAINER_ID;
  const key = process.env.COSMOS_KEY;

  const missing: string[] = [];
  if (!endpoint) missing.push('COSMOS_ENDPOINT');
  if (!databaseId) missing.push('COSMOS_DATABASE_ID');
  if (!containerId) missing.push('COSMOS_CONTAINER_ID');
  if (!key) missing.push('COSMOS_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cosmos configuration from environment: ${missing.join(
        ', '
      )}`
    );
  }

  inventoryItemRepoSingleton = new CosmosInventoryItemRepo({
    endpoint: endpoint!,
    databaseId: databaseId!,
    containerId: containerId!,
    partitionKey: PARTITION_KEY,
    key: key!,
  });
  return inventoryItemRepoSingleton;
};
