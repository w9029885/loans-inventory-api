import { describe, it, expect } from 'vitest';
import { deleteDeviceUseCase } from './delete-device';
import { FakeDeviceRepo } from '../infra/fake-device-repo';
import { Device } from '../domain/device';

describe('deleteDeviceUseCase', () => {
  describe('successful deletion', () => {
    it('should delete existing device and return true', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-to-delete-1',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = { id: 'device-to-delete-1' };

      // Act
      const result = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBe(true);
    });

    it('should remove device from repository', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-to-delete-2',
        name: 'Device Name',
        description: 'Description',
        count: 10,
        updatedAt: new Date('2025-01-02'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = { id: 'device-to-delete-2' };

      // Act
      const result = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBe(true);
      const retrieved = await deviceRepo.getById('device-to-delete-2');
      expect(retrieved).toBeNull();
    });

    it('should delete device even if it has multiple properties', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-to-delete-3',
        name: 'Complex Device',
        description: 'A device with many properties',
        count: 999,
        updatedAt: new Date('2025-12-25'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = { id: 'device-to-delete-3' };

      // Act
      const result = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBe(true);
      const retrieved = await deviceRepo.getById('device-to-delete-3');
      expect(retrieved).toBeNull();
    });
  });

  describe('device not found scenarios', () => {
    it('should return false when device does not exist', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = { id: 'nonexistent-device' };

      // Act
      const result = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for non-existent id even with existing devices', async () => {
      // Arrange
      const existingDevices: Device[] = [
        {
          id: 'device-1',
          name: 'Device 1',
          description: 'Description 1',
          count: 5,
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'device-2',
          name: 'Device 2',
          description: 'Description 2',
          count: 10,
          updatedAt: new Date('2025-01-02'),
        },
      ];
      const deviceRepo = new FakeDeviceRepo(existingDevices);
      const deps = { deviceRepo };
      const cmd = { id: 'device-3' };

      // Act
      const result = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result).toBe(false);
      // Verify other devices still exist
      expect(await deviceRepo.getById('device-1')).not.toBeNull();
      expect(await deviceRepo.getById('device-2')).not.toBeNull();
    });

    it('should not affect other devices when deleting non-existent device', async () => {
      // Arrange
      const existingDevices: Device[] = [
        {
          id: 'device-keep-1',
          name: 'Keep Device 1',
          description: 'Keep Description 1',
          count: 5,
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'device-keep-2',
          name: 'Keep Device 2',
          description: 'Keep Description 2',
          count: 10,
          updatedAt: new Date('2025-01-02'),
        },
      ];
      const deviceRepo = new FakeDeviceRepo(existingDevices);
      const deps = { deviceRepo };
      const cmd = { id: 'device-nonexistent' };

      // Act
      await deleteDeviceUseCase(deps, cmd);

      // Assert - verify all devices still exist
      const devices = await deviceRepo.list();
      expect(devices).toHaveLength(2);
      expect(devices).toContainEqual(existingDevices[0]);
      expect(devices).toContainEqual(existingDevices[1]);
    });
  });

  describe('multiple deletions', () => {
    it('should delete multiple devices in sequence', async () => {
      // Arrange
      const existingDevices: Device[] = [
        {
          id: 'device-seq-1',
          name: 'Device 1',
          description: 'Description 1',
          count: 5,
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'device-seq-2',
          name: 'Device 2',
          description: 'Description 2',
          count: 10,
          updatedAt: new Date('2025-01-02'),
        },
        {
          id: 'device-seq-3',
          name: 'Device 3',
          description: 'Description 3',
          count: 15,
          updatedAt: new Date('2025-01-03'),
        },
      ];
      const deviceRepo = new FakeDeviceRepo(existingDevices);
      const deps = { deviceRepo };

      // Act - delete first device
      const result1 = await deleteDeviceUseCase(deps, { id: 'device-seq-1' });
      // Act - delete second device
      const result2 = await deleteDeviceUseCase(deps, { id: 'device-seq-2' });
      // Act - delete third device
      const result3 = await deleteDeviceUseCase(deps, { id: 'device-seq-3' });

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      const devices = await deviceRepo.list();
      expect(devices).toHaveLength(0);
    });

    it('should handle deleting same device twice', async () => {
      // Arrange
      const existingDevice: Device = {
        id: 'device-twice',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const deviceRepo = new FakeDeviceRepo([existingDevice]);
      const deps = { deviceRepo };
      const cmd = { id: 'device-twice' };

      // Act - delete once (succeeds)
      const result1 = await deleteDeviceUseCase(deps, cmd);
      // Act - delete again (fails)
      const result2 = await deleteDeviceUseCase(deps, cmd);

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});
