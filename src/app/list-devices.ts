import { Device } from '../domain/device';
import { DeviceRepo } from '../domain/device-repo';

// Dependencies container for the use case (single-parameter deps pattern)
export type ListDevicesDeps = {
  deviceRepo: DeviceRepo;
};

// Application-layer use case: list devices.
// Thin and pure – delegates directly to the repository.
export const listDevices = async (deps: ListDevicesDeps): Promise<Device[]> => {
  return deps.deviceRepo.list();
};
