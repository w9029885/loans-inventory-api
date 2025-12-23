import { getDeviceRepo } from '../config/appServices';
import { seedDevices } from './data';

const loadLocalSettingsEnv = () => {
  // Azure Functions loads local.settings.json into env vars when running `func start`.
  // But `npm run seed` runs `node dist/...` directly, so we load it ourselves.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');

    const localSettingsPath = path.resolve(
      __dirname,
      '../../../local.settings.json'
    );
    if (!fs.existsSync(localSettingsPath)) return;

    const raw = fs.readFileSync(localSettingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    const values = parsed?.Values;
    if (!values || typeof values !== 'object') return;

    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] !== undefined) continue;
      if (typeof value === 'string') process.env[key] = value;
    }
  } catch {
    // No-op: seeding can still work if env vars are provided another way.
  }
};

const run = async () => {
  loadLocalSettingsEnv();
  console.log('[seed] Starting device seed...');
  const repo = getDeviceRepo();

  let savedCount = 0;
  for (const device of seedDevices) {
    try {
      await repo.save(device);
      savedCount++;
      console.log(`[seed] Upserted: ${device.id}`);
    } catch (err) {
      console.error(`[seed] Failed to upsert ${device.id}:`, err);
    }
  }
  console.log(`[seed] Completed. ${savedCount} devices processed.`);
};

run().catch((e) => {
  console.error('[seed] Unhandled error:', e);
  process.exit(1);
});
