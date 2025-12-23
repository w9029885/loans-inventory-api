import { DeviceRepo } from '../domain/device-repo';

export type DeleteDeviceDeps = {
  deviceRepo: DeviceRepo;
};

export type DeleteDeviceCommand = {
  id: string;
};

/** Returns true if deleted, false if the device did not exist. */
export const deleteDeviceUseCase = async (
  deps: DeleteDeviceDeps,
  cmd: DeleteDeviceCommand
): Promise<boolean> => {
  const existing = await deps.deviceRepo.getById(cmd.id);
  if (!existing) return false;
  await deps.deviceRepo.delete(cmd.id);
  return true;
};
