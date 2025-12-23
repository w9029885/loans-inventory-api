import { createDevice, Device } from '../domain/device';
import { DeviceRepo } from '../domain/device-repo';

export type UpdateDeviceDeps = {
  deviceRepo: DeviceRepo;
  /** Optional clock for testability */
  now?: () => Date;
};

export type UpdateDeviceCommand = {
  id: string;
  name?: string;
  description?: string;
  count?: number;
};

export const updateDeviceUseCase = async (
  deps: UpdateDeviceDeps,
  cmd: UpdateDeviceCommand
): Promise<Device | null> => {
  const existing = await deps.deviceRepo.getById(cmd.id);
  if (!existing) return null;

  const now = deps.now?.() || new Date();

  const updated = createDevice({
    id: existing.id,
    name: cmd.name ?? existing.name,
    description: cmd.description ?? existing.description,
    count: cmd.count ?? existing.count,
    updatedAt: now,
  });

  return deps.deviceRepo.save(updated);
};
