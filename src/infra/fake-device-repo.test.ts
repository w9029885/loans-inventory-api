import { describe, it, expect } from 'vitest';
import { FakeDeviceRepo } from './fake-device-repo';
import { Device } from '../domain/device';

describe('FakeDeviceRepo', () => {
  describe('initialization', () => {
    it('should initialize with empty store', async () => {
      // Arrange & Act
      const repo = new FakeDeviceRepo();

      // Assert
      await expect(repo.list()).resolves.toEqual([]);
    });

    it('should initialize with provided devices', async () => {
      // Arrange
      const devices: Device[] = [
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

      // Act
      const repo = new FakeDeviceRepo(devices);
      const result = await repo.list();

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(devices);
    });

    it('should store copies of devices, not references', async () => {
      // Arrange
      const device: Device = {
        id: 'device-ref-test',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };

      // Act
      const repo = new FakeDeviceRepo([device]);
      const result = await repo.list();

      // Assert - verify it's a copy, not the same reference
      expect(result[0]).not.toBe(device);
      expect(result[0]).toEqual(device);
    });
  });

  describe('getById', () => {
    it('should return device by id', async () => {
      // Arrange
      const device: Device = {
        id: 'device-find',
        name: 'Find Me',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const repo = new FakeDeviceRepo([device]);

      // Act
      const result = await repo.getById('device-find');

      // Assert
      expect(result).toEqual(device);
    });

    it('should return null when device not found', async () => {
      // Arrange
      const repo = new FakeDeviceRepo();

      // Act
      const result = await repo.getById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should return copy of device, not reference', async () => {
      // Arrange
      const device: Device = {
        id: 'device-copy',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const repo = new FakeDeviceRepo([device]);

      // Act
      const result = await repo.getById('device-copy');

      // Assert - verify it's a copy
      expect(result).not.toBe(device);
      expect(result).toEqual(device);
    });

    it('should find device among multiple devices', async () => {
      // Arrange
      const devices: Device[] = [
        {
          id: 'device-a',
          name: 'Device A',
          description: 'Description A',
          count: 1,
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'device-b',
          name: 'Device B',
          description: 'Description B',
          count: 2,
          updatedAt: new Date('2025-01-02'),
        },
        {
          id: 'device-c',
          name: 'Device C',
          description: 'Description C',
          count: 3,
          updatedAt: new Date('2025-01-03'),
        },
      ];
      const repo = new FakeDeviceRepo(devices);

      // Act
      const result = await repo.getById('device-b');

      // Assert
      expect(result).toEqual(devices[1]);
    });
  });

  describe('list', () => {
    it('should return all devices', async () => {
      // Arrange
      const devices: Device[] = [
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
      const repo = new FakeDeviceRepo(devices);

      // Act
      const result = await repo.list();

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(devices);
    });

    it('should return empty array when no devices', async () => {
      // Arrange
      const repo = new FakeDeviceRepo();

      // Act
      const result = await repo.list();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return copies of devices, not references', async () => {
      // Arrange
      const devices: Device[] = [
        {
          id: 'device-1',
          name: 'Device 1',
          description: 'Description 1',
          count: 5,
          updatedAt: new Date('2025-01-01'),
        },
      ];
      const repo = new FakeDeviceRepo(devices);

      // Act
      const result = await repo.list();

      // Assert - verify they're copies
      expect(result[0]).not.toBe(devices[0]);
      expect(result[0]).toEqual(devices[0]);
    });
  });

  describe('save', () => {
    it('should create new device', async () => {
      // Arrange
      const device: Device = {
        id: 'device-new',
        name: 'New Device',
        description: 'New Description',
        count: 7,
        updatedAt: new Date('2025-06-15'),
      };
      const repo = new FakeDeviceRepo();

      // Act
      const result = await repo.save(device);

      // Assert
      expect(result).toEqual(device);
      const retrieved = await repo.getById('device-new');
      expect(retrieved).toEqual(device);
    });

    it('should update existing device', async () => {
      // Arrange
      const originalDevice: Device = {
        id: 'device-update',
        name: 'Original Name',
        description: 'Original Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const updatedDevice: Device = {
        id: 'device-update',
        name: 'Updated Name',
        description: 'Updated Description',
        count: 10,
        updatedAt: new Date('2025-01-02'),
      };
      const repo = new FakeDeviceRepo([originalDevice]);

      // Act
      const result = await repo.save(updatedDevice);

      // Assert
      expect(result).toEqual(updatedDevice);
      const retrieved = await repo.getById('device-update');
      expect(retrieved).toEqual(updatedDevice);
      expect(retrieved!.name).toBe('Updated Name');
      expect(retrieved!.count).toBe(10);
    });

    it('should return copy of saved device', async () => {
      // Arrange
      const device: Device = {
        id: 'device-copy-test',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const repo = new FakeDeviceRepo();

      // Act
      const result = await repo.save(device);

      // Assert - verify it's a copy
      expect(result).not.toBe(device);
      expect(result).toEqual(device);
    });

    it('should save multiple devices', async () => {
      // Arrange
      const device1: Device = {
        id: 'device-1',
        name: 'Device 1',
        description: 'Description 1',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const device2: Device = {
        id: 'device-2',
        name: 'Device 2',
        description: 'Description 2',
        count: 10,
        updatedAt: new Date('2025-01-02'),
      };
      const repo = new FakeDeviceRepo();

      // Act
      await repo.save(device1);
      await repo.save(device2);

      // Assert
      const result = await repo.list();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(device1);
      expect(result).toContainEqual(device2);
    });
  });

  describe('delete', () => {
    it('should delete existing device', async () => {
      // Arrange
      const device: Device = {
        id: 'device-delete',
        name: 'Device Name',
        description: 'Description',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };
      const repo = new FakeDeviceRepo([device]);

      // Act
      await repo.delete('device-delete');

      // Assert
      const result = await repo.getById('device-delete');
      expect(result).toBeNull();
    });

    it('should not throw when deleting non-existent device', async () => {
      // Arrange
      const repo = new FakeDeviceRepo();

      // Act & Assert - should not throw
      await expect(repo.delete('nonexistent')).resolves.toBeUndefined();
    });

    it('should delete only specified device', async () => {
      // Arrange
      const devices: Device[] = [
        {
          id: 'device-keep',
          name: 'Keep Device',
          description: 'Description',
          count: 5,
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'device-delete',
          name: 'Delete Device',
          description: 'Description',
          count: 10,
          updatedAt: new Date('2025-01-02'),
        },
      ];
      const repo = new FakeDeviceRepo(devices);

      // Act
      await repo.delete('device-delete');

      // Assert
      const result = await repo.list();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('device-keep');
    });

    it('should handle deleting all devices', async () => {
      // Arrange
      const devices: Device[] = [
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
      const repo = new FakeDeviceRepo(devices);

      // Act
      await repo.delete('device-1');
      await repo.delete('device-2');

      // Assert
      const result = await repo.list();
      expect(result).toHaveLength(0);
    });
  });
});
