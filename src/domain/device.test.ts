import { describe, it, expect } from 'vitest';
import { createDevice, DeviceError } from './device';

describe('createDevice', () => {
  describe('valid device creation', () => {
    it('should create a device with valid parameters', () => {
      // Arrange
      const params = {
        id: 'device-123',
        name: 'Laptop',
        description: 'Dell XPS Laptop',
        count: 5,
        updatedAt: new Date('2025-01-01'),
      };

      // Act
      const device = createDevice(params);

      // Assert
      expect(device).toEqual(params);
    });

    it('should create a device with count of 0', () => {
      // Arrange
      const params = {
        id: 'device-456',
        name: 'Monitor',
        description: '4K Monitor',
        count: 0,
        updatedAt: new Date('2025-01-01'),
      };

      // Act
      const device = createDevice(params);

      // Assert
      expect(device.count).toBe(0);
      expect(device).toEqual(params);
    });

    it('should create a device with large count', () => {
      // Arrange
      const params = {
        id: 'device-789',
        name: 'Keyboard',
        description: 'Mechanical Keyboard',
        count: 999999,
        updatedAt: new Date('2025-12-31'),
      };

      // Act
      const device = createDevice(params);

      // Assert
      expect(device.count).toBe(999999);
    });
  });

  describe('id validation', () => {
    it('should throw DeviceError when id is only whitespace', () => {
      // Arrange
      const params = {
        id: '   ',
        name: 'Mouse',
        description: 'Wireless Mouse',
        count: 10,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('Device id must be a non-empty string');
    });

    it('should throw DeviceError when id is empty string', () => {
      // Arrange
      const params = {
        id: '',
        name: 'Monitor',
        description: '27 inch Monitor',
        count: 5,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });

    it('should throw DeviceError when id is missing', () => {
      // Arrange
      const params = {
        id: undefined as any,
        name: 'Headset',
        description: 'USB Headset',
        count: 3,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });
  });

  describe('name validation', () => {
    it('should throw DeviceError when name is only whitespace', () => {
      // Arrange
      const params = {
        id: 'device-001',
        name: '   ',
        description: 'Some device',
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('Device name must be a non-empty string');
    });

    it('should throw DeviceError when name is empty string', () => {
      // Arrange
      const params = {
        id: 'device-002',
        name: '',
        description: 'Some device',
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });

    it('should throw DeviceError when name is missing', () => {
      // Arrange
      const params = {
        id: 'device-003',
        name: undefined as any,
        description: 'Some device',
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });
  });

  describe('description validation', () => {
    it('should throw DeviceError when description is only whitespace', () => {
      // Arrange
      const params = {
        id: 'device-004',
        name: 'Device Name',
        description: '   ',
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('Device description must be a non-empty string');
    });

    it('should throw DeviceError when description is empty string', () => {
      // Arrange
      const params = {
        id: 'device-005',
        name: 'Device Name',
        description: '',
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });

    it('should throw DeviceError when description is missing', () => {
      // Arrange
      const params = {
        id: 'device-006',
        name: 'Device Name',
        description: undefined as any,
        count: 1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });
  });

  describe('count validation', () => {
    it('should throw DeviceError when count is negative', () => {
      // Arrange
      const params = {
        id: 'device-007',
        name: 'Device Name',
        description: 'A device',
        count: -1,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('count must be a number greater than or equal to 0');
    });

    it('should throw DeviceError when count is float', () => {
      // Arrange
      const params = {
        id: 'device-008',
        name: 'Device Name',
        description: 'A device',
        count: 3.5,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('count must be an integer');
    });

    it('should throw DeviceError when count is NaN', () => {
      // Arrange
      const params = {
        id: 'device-009',
        name: 'Device Name',
        description: 'A device',
        count: NaN,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });

    it('should throw DeviceError when count is Infinity', () => {
      // Arrange
      const params = {
        id: 'device-010',
        name: 'Device Name',
        description: 'A device',
        count: Infinity,
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });
  });

  describe('updatedAt validation', () => {
    it('should throw DeviceError when updatedAt is not a Date', () => {
      // Arrange
      const params = {
        id: 'device-011',
        name: 'Device Name',
        description: 'A device',
        count: 1,
        updatedAt: '2025-01-01' as any,
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
      expect(() => createDevice(params)).toThrow('updatedAt must be a valid Date object');
    });

    it('should throw DeviceError when updatedAt is an invalid Date', () => {
      // Arrange
      const params = {
        id: 'device-012',
        name: 'Device Name',
        description: 'A device',
        count: 1,
        updatedAt: new Date('invalid'),
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });

    it('should throw DeviceError when updatedAt is missing', () => {
      // Arrange
      const params = {
        id: 'device-013',
        name: 'Device Name',
        description: 'A device',
        count: 1,
        updatedAt: undefined as any,
      };

      // Act & Assert
      expect(() => createDevice(params)).toThrow(DeviceError);
    });
  });
});
