import { describe, it, expect } from 'vitest';
import { listDevices } from './list-devices';
import { FakeDeviceRepo } from '../infra/fake-device-repo';
import { Device } from '../domain/device';

describe('listDevices', () => {
  it('should return empty array when no devices exist', async () => {
    // Arrange
    const deviceRepo = new FakeDeviceRepo();

    // Act
    const result = await listDevices({ deviceRepo });

    // Assert
    expect(result).toEqual([]);
  });

  it('should return all devices from the repository', async () => {
    // Arrange
    const devices: Device[] = [
      {
        id: 'device-1',
        name: 'Laptop',
        description: 'Dell XPS',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      },
      {
        id: 'device-2',
        name: 'Monitor',
        description: '4K Monitor',
        count: 10,
        updatedAt: new Date('2025-01-02'),
      },
      {
        id: 'device-3',
        name: 'Mouse',
        description: 'Wireless Mouse',
        count: 20,
        updatedAt: new Date('2025-01-03'),
      },
    ];
    const deviceRepo = new FakeDeviceRepo(devices);

    // Act
    const result = await listDevices({ deviceRepo });

    // Assert
    expect(result).toHaveLength(3);
    expect(result).toEqual(devices);
  });

  it('should return devices with correct properties', async () => {
    // Arrange
    const devices: Device[] = [
      {
        id: 'device-test',
        name: 'Keyboard',
        description: 'Mechanical Keyboard',
        count: 8,
        updatedAt: new Date('2025-12-25'),
      },
    ];
    const deviceRepo = new FakeDeviceRepo(devices);

    // Act
    const result = await listDevices({ deviceRepo });

    // Assert
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('count');
    expect(result[0]).toHaveProperty('updatedAt');
  });

  it('should not return the same object reference (should be copies)', async () => {
    // Arrange
    const device: Device = {
      id: 'device-unique',
      name: 'Headset',
      description: 'USB Headset',
      count: 3,
      updatedAt: new Date('2025-06-15'),
    };
    const deviceRepo = new FakeDeviceRepo([device]);

    // Act
    const result = await listDevices({ deviceRepo });

    // Assert
    expect(result[0]).not.toBe(device);
    expect(result[0]).toEqual(device);
  });
});
