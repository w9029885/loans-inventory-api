import { Device } from '../domain/device';

// Sample devices for seeding lab environment.
// updatedAt times are set to recent dates.
export const seedDevices: Device[] = [
  {
    id: 'device-1001',
    name: 'USB-C Cable 1m',
    description: 'High quality USB-C to USB-C cable (1 meter).',
    count: 25,
    updatedAt: new Date('2025-11-01T10:00:00.000Z'),
  },
  {
    id: 'device-1002',
    name: 'Wireless Mouse',
    description: '2.4G ergonomic wireless mouse with receiver.',
    count: 12,
    updatedAt: new Date('2025-11-05T12:30:00.000Z'),
  },
  {
    id: 'device-1003',
    name: 'Mechanical Keyboard',
    description: 'Compact 60% mechanical keyboard (brown switches).',
    count: 8,
    updatedAt: new Date('2025-11-10T09:15:00.000Z'),
  },
  {
    id: 'device-1004',
    name: '1080p Webcam',
    description: 'HD webcam with built-in microphone.',
    count: 5,
    updatedAt: new Date('2025-11-12T14:45:00.000Z'),
  },
  {
    id: 'device-1005',
    name: 'Portable SSD 1TB',
    description: 'USB 3.2 Gen 2 portable solid state drive.',
    count: 3,
    updatedAt: new Date('2025-11-15T08:05:00.000Z'),
  },
];
