import { createDevice, Device } from '../domain/device';
import { DeviceRepo } from '../domain/device-repo';

export type CreateDeviceDeps = {
  deviceRepo: DeviceRepo;
  /** Optional id generator for testability */
  generateId?: () => string;
  /** Optional clock for testability */
  now?: () => Date;
};

export type CreateDeviceCommand = {
  name: string;
  description: string;
  /** Total number of devices of this model in the pool. Defaults to 1. */
  count?: number;
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
  return `device-${ts}-${rand}`;
};

export const createDeviceUseCase = async (
  deps: CreateDeviceDeps,
  cmd: CreateDeviceCommand
): Promise<Device> => {
  const id = cmd.id || deps.generateId?.() || defaultId();
  const now = deps.now?.() || new Date();
  const count = cmd.count ?? 1;

  const entity = createDevice({
    id,
    name: cmd.name,
    description: cmd.description,
    count,
    updatedAt: now,
  });

  return deps.deviceRepo.save(entity);
};
