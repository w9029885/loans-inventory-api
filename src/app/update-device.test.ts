import { describe, it, expect } from 'vitest';
import { updateDeviceUseCase } from './update-device';
import { FakeDeviceRepo } from '../infra/fake-device-repo';
import { Device } from '../domain/device';
import { DeviceError } from '../domain/device';

describe('updateDeviceUseCase', () => {
  describe('valid device update', () => {
    it('should update device name', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-1',
        name: 'Old Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-1',
        name: 'New Name',
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.name).toBe('New Name');
      expect(result!.description).toBe('Description');
      expect(result!.count).toBe(5);
    });

    it('should update device description', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-2',
        name: 'Device Name',
        description: 'Old Description',
        count: 10,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-2',
        description: 'New Description',
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Device Name');
      expect(result!.description).toBe('New Description');
      expect(result!.count).toBe(10);
    });

    it('should update device count', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-3',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-3',
        count: 20,
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.count).toBe(20);
      expect(result!.name).toBe('Device Name');
      expect(result!.description).toBe('Description');
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-4',
        name: 'Old Name',
        description: 'Old Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-4',
        name: 'New Name',
        description: 'New Description',
        count: 15,
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.name).toBe('New Name');
      expect(result!.description).toBe('New Description');
      expect(result!.count).toBe(15);
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const oldDate = new Date('2025-01-01');
      const newDate = new Date('2025-12-25');
      const existingDevice: Device = {
        id: 'device-5',
        name: 'Device',
        description: 'Description',
        count: 5,
        updatedAt: oldDate,
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo, now: () => newDate };
      const cmd = {
        id: 'device-5',
        name: 'Updated Device',
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.updatedAt).toEqual(newDate);
    });

    it('should persist updated device to repository', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-6',
        name: 'Original Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-6',
        name: 'Updated Name',
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert - verify it persisted in repo
      const retrieved = await deviceRepo.getById('device-6');
      expect(retrieved).toEqual(result);
      expect(retrieved!.name).toBe('Updated Name');
    });
  });

  describe('device not found scenarios', () => {
    it('should return null when device does not exist', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'nonexistent-device',
        name: 'New Name',
      };

      // Act
      const result = await updateDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBeNull();
    });

    it('should not create device if it does not exist', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'new-device-that-does-not-exist',
        name: 'Device Name',
        description: 'Description',
        count: 5,
      };

      // Act
      await updateDeviceUseCase(deps, cmd);

      // Assert - verify device was not created
      const retrieved = await deviceRepo.getById('new-device-that-does-not-exist');
      expect(retrieved).toBeNull();
    });
  });

  describe('invalid update scenarios', () => {
    it('should throw DeviceError when updated name is empty', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-7',
        name: 'Valid Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-7',
        name: '',
      };

      // Act & Assert
      await expect(updateDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });

    it('should throw DeviceError when updated description is empty', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-8',
        name: 'Device Name',
        description: 'Valid Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-8',
        description: '',
      };

      // Act & Assert
      await expect(updateDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });

    it('should throw DeviceError when updated count is negative', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-9',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-9',
        count: -10,
      };

      // Act & Assert
      await expect(updateDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });
  });
});
