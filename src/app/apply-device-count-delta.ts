import { createDevice, Device } from '../domain/device';
import { DeviceRepo } from '../domain/device-repo';

export type ApplyDeviceCountDeltaDeps = {
  deviceRepo: DeviceRepo;
  now?: () => Date;
};

export type ApplyDeviceCountDeltaCommand = {
  deviceId: string;
  delta: number;
};

export type ApplyDeviceCountDeltaResult =
  | { success: true; device: Device }
  | { success: false; error: 'not_found' | 'would_go_negative'; message: string };

export const applyDeviceCountDeltaUseCase = async (
  deps: ApplyDeviceCountDeltaDeps,
  cmd: ApplyDeviceCountDeltaCommand
): Promise<ApplyDeviceCountDeltaResult> => {
  const existing = await deps.deviceRepo.getById(cmd.deviceId);
  if (!existing) {
    return {
      success: false,
      error: 'not_found',
      message: `Device with id '${cmd.deviceId}' not found.`,
    };
  }

  const updatedCount = existing.count + cmd.delta;
  if (updatedCount < 0) {
    return {
      success: false,
      error: 'would_go_negative',
      message: `Cannot apply delta ${cmd.delta} to device '${cmd.deviceId}': count would become ${updatedCount}.`,
    };
  }

  const now = deps.now?.() || new Date();
  const updated = createDevice({
    id: existing.id,
    name: existing.name,
    description: existing.description,
    count: updatedCount,
    updatedAt: now,
  });

  const saved = await deps.deviceRepo.save(updated);
  return { success: true, device: saved };
};
