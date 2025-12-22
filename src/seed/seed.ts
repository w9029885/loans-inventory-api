import { getInventoryItemRepo } from '../config/appServices';
import { seedInventoryItems } from './data';

const run = async () => {
  console.log('[seed] Starting inventory item seed...');
  const repo = getInventoryItemRepo();

  let savedCount = 0;
  for (const item of seedInventoryItems) {
    try {
      await repo.save(item);
      savedCount++;
      console.log(`[seed] Upserted: ${item.id}`);
    } catch (err) {
      console.error(`[seed] Failed to upsert ${item.id}:`, err);
    }
  }
  console.log(`[seed] Completed. ${savedCount} items processed.`);
};

run().catch((e) => {
  console.error('[seed] Unhandled error:', e);
  process.exit(1);
});
