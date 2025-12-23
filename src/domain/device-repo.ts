import { Device } from './device';

/**
 * Repository interface for persisting and retrieving Device entities.
 * Implementations should map these methods to whatever backing store is used
 * (in-memory, database, external service, etc.).
 */
export interface DeviceRepo {
  /**
   * Fetch a device by id. Returns null if not found.
   */
  getById(id: string): Promise<Device | null>;

  /**
   * List all devices. Implementations may choose to add pagination later.
   */
  list(): Promise<Device[]>;

  /**
   * Save a device (create or update / upsert).
   * Implementations should insert the device if it does not exist, or
   * update the existing record if it does. Return the saved Device (which
   * may include store-generated fields or normalized values).
   */
  save(device: Device): Promise<Device>;

  /**
   * Remove a device by id. No-op if the device does not exist.
   */
  delete(id: string): Promise<void>;
}
