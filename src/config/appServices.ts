import { CosmosDeviceRepo } from '../infra/cosmos-device-repo';
import { FakeDeviceRepo } from '../infra/fake-device-repo';
import { DeviceRepo } from '../domain/device-repo';
import { OAuth2Validator } from '../infra/oauth2-validator';
import type { AuthContext } from '../app/auth-context';
import type { HttpRequest } from '@azure/functions';
import { seedDevices } from '../seed/data';

// Read configuration from environment variables
// Set USE_FAKE_REPO=true to use in-memory fake repo for local development
// Otherwise, Cosmos configuration is required:
// - COSMOS_ENDPOINT (or COSMOS_ACCOUNT_NAME)
// - COSMOS_KEY
//
// Optional:
// - COSMOS_DATABASE_ID (defaults to 'loans-db')
// - COSMOS_CONTAINER_ID (defaults to 'devices')
// - COSMOS_PARTITION_KEY (defaults to 'id')
const DEFAULT_DATABASE_ID = 'loans-db';
const DEFAULT_CONTAINER_ID = 'devices';
const PARTITION_KEY = process.env.COSMOS_PARTITION_KEY || 'id';

let deviceRepoSingleton: DeviceRepo | null = null;
let oauth2ValidatorSingleton: OAuth2Validator | null = null;

export const getDeviceRepo = (): DeviceRepo => {
  if (deviceRepoSingleton) return deviceRepoSingleton;

  // Check if we should use the fake repo for local development
  const useFakeRepo = process.env.USE_FAKE_REPO === 'true';

  if (useFakeRepo) {
    console.log('Using FakeDeviceRepo with seed data for local development');
    deviceRepoSingleton = new FakeDeviceRepo(seedDevices);
    return deviceRepoSingleton;
  }

  // Otherwise use Cosmos
  const accountName = process.env.COSMOS_ACCOUNT_NAME;
  const endpoint =
    process.env.COSMOS_ENDPOINT ||
    (accountName
      ? `https://${accountName}.documents.azure.com:443/`
      : undefined);
  const databaseId = process.env.COSMOS_DATABASE_ID || DEFAULT_DATABASE_ID;
  const containerId = process.env.COSMOS_CONTAINER_ID || DEFAULT_CONTAINER_ID;
  const key = process.env.COSMOS_KEY;

  const missing: string[] = [];
  if (!endpoint) missing.push('COSMOS_ENDPOINT');
  if (!key) missing.push('COSMOS_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cosmos configuration from environment: ${missing.join(
        ', '
      )}. Set USE_FAKE_REPO=true to use fake repo for local development.`
    );
  }

  deviceRepoSingleton = new CosmosDeviceRepo({
    endpoint: endpoint!,
    databaseId: databaseId!,
    containerId: containerId!,
    partitionKey: PARTITION_KEY,
    key: key!,
  });
  return deviceRepoSingleton;
};

export const getOAuth2Validator = (): OAuth2Validator | null => {
  if (oauth2ValidatorSingleton) return oauth2ValidatorSingleton;

  const jwksUri = process.env.OAUTH2_JWKS_URI;
  const issuer = process.env.OAUTH2_ISSUER;
  const audience = process.env.OAUTH2_AUDIENCE;
  const rolesClaim = process.env.OAUTH2_ROLES_CLAIM;

  if (jwksUri && issuer && audience) {
    oauth2ValidatorSingleton = new OAuth2Validator({
      jwksUri,
      issuer,
      audience,
      rolesClaim,
    });
  }

  return oauth2ValidatorSingleton;
};

export const resolveAuthContext = async (
  request: HttpRequest,
): Promise<AuthContext> => {
  const validator = getOAuth2Validator();
  if (!validator) return { authenticated: false, scopes: [], roles: [] };
  return validator.validate(request);
};
