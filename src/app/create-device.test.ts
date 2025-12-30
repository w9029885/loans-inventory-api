import { describe, it, expect, vi } from 'vitest';
import { createDeviceUseCase } from './create-device';
import { FakeDeviceRepo } from '../infra/fake-device-repo';
import { DeviceError } from '../domain/device';

describe('createDeviceUseCase', () => {
  describe('valid device creation', () => {
    it('should create a device with valid command', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-new-1',
        name: 'Laptop',
        description: 'Dell XPS',
        count: 5,
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.id).toBe('device-new-1');
      expect(result.name).toBe('Laptop');
      expect(result.description).toBe('Dell XPS');
      expect(result.count).toBe(5);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should default count to 1 when not provided', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-new-2',
        name: 'Monitor',
        description: '4K Monitor',
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.count).toBe(1);
    });

    it('should use provided count over default', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-new-3',
        name: 'Mouse',
        description: 'Wireless Mouse',
        count: 15,
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.count).toBe(15);
    });

    it('should save device to repository', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-new-4',
        name: 'Keyboard',
        description: 'Mechanical Keyboard',
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert - verify it's in the repo
      const retrieved = await deviceRepo.getById('device-new-4');
      expect(retrieved).toEqual(result);
    });

    it('should use provided now function', async () => {
      // Arrange
      const testDate = new Date('2025-06-15T10:30:00Z');
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo, now: () => testDate };
      const cmd = {
        id: 'device-new-5',
        name: 'Headset',
        description: 'USB Headset',
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.updatedAt).toEqual(testDate);
    });

    it('should use default id generator when id not provided', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        name: 'Charger',
        description: 'USB-C Charger',
        count: 3,
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^device-/);
    });

    it('should use provided generateId function', async () => {
      // Arrange
      const customIdGen = () => 'custom-id-xyz';
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo, generateId: customIdGen };
      const cmd = {
        name: 'Cable',
        description: 'HDMI Cable',
      };

      // Act
      const result = await createDeviceUseCase(deps, cmd);

      // Assert
      expect(result.id).toBe('custom-id-xyz');
    });
  });

  describe('invalid device creation', () => {
    it('should throw DeviceError when name is empty', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-invalid-1',
        name: '',
        description: 'Some device',
      };

      // Act & Assert
      await expect(createDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });

    it('should throw DeviceError when description is empty', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-invalid-2',
        name: 'Device Name',
        description: '',
      };

      // Act & Assert
      await expect(createDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });

    it('should throw DeviceError when count is negative', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-invalid-3',
        name: 'Device Name',
        description: 'A device',
        count: -5,
      };

      // Act & Assert
      await expect(createDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });

    it('should throw DeviceError when count is a float', async () => {
      // Arrange
      const deviceRepo = new FakeDeviceRepo();
      const deps = { deviceRepo };
      const cmd = {
        id: 'device-invalid-4',
        name: 'Device Name',
        description: 'A device',
        count: 2.7,
      };

      // Act & Assert
      await expect(createDeviceUseCase(deps, cmd)).rejects.toThrow(DeviceError);
    });
  });
});
