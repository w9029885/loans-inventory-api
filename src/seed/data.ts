import { InventoryItem, InventoryItemStatus } from '../domain/inventory-item';

// Sample inventory items for seeding lab environment.
// updatedAt times are set to recent dates.
export const seedInventoryItems: InventoryItem[] = [
  {
    id: 'item-1001',
    name: 'USB-C Cable 1m',
    description: 'High quality USB-C to USB-C cable (1 meter).',
    status: 'available' as InventoryItemStatus,
    updatedAt: new Date('2025-11-01T10:00:00.000Z'),
  },
  {
    id: 'item-1002',
    name: 'Wireless Mouse',
    description: '2.4G ergonomic wireless mouse with receiver.',
    status: 'reserved' as InventoryItemStatus,
    updatedAt: new Date('2025-11-05T12:30:00.000Z'),
  },
  {
    id: 'item-1003',
    name: 'Mechanical Keyboard',
    description: 'Compact 60% mechanical keyboard (brown switches).',
    status: 'available' as InventoryItemStatus,
    updatedAt: new Date('2025-11-10T09:15:00.000Z'),
  },
  {
    id: 'item-1004',
    name: '1080p Webcam',
    description: 'HD webcam with built-in microphone.',
    status: 'loaned' as InventoryItemStatus,
    updatedAt: new Date('2025-11-12T14:45:00.000Z'),
  },
  {
    id: 'item-1005',
    name: 'Portable SSD 1TB',
    description: 'USB 3.2 Gen 2 portable solid state drive.',
    status: 'available' as InventoryItemStatus,
    updatedAt: new Date('2025-11-15T08:05:00.000Z'),
  },
];
