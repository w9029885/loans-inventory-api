import { CosmosClient, Container } from '@azure/cosmos';
import { Device } from '../domain/device';
import { DeviceRepo } from '../domain/device-repo';

type Options = {
  endpoint: string;
  databaseId: string;
  containerId: string;
  /** Optional access key for key-based auth */
  key?: string;
  /** Partition key field name (without leading slash). Defaults to `id`. */
  partitionKey?: string;
};

type CosmosDeviceDto = {
  id: string;
  name: string;
  description: string;
  count: Device['count'];
  updatedAt: string; // ISO string
};

export class CosmosDeviceRepo implements DeviceRepo {
  private client: CosmosClient;
  private container: Container;
  private partitionKey: string;

  constructor(options: Options) {
    const {
      endpoint,
      key,
      databaseId,
      containerId,
      partitionKey = 'id',
    } = options;
    if (!endpoint || !databaseId || !containerId) {
      throw new Error('endpoint, databaseId and containerId are required');
    }

    // If a key is provided use key-based auth; otherwise rely on other credential mechanisms.
    const clientOptions = (key ? { endpoint, key } : { endpoint }) as any;
    this.client = new CosmosClient(clientOptions);
    this.container = this.client.database(databaseId).container(containerId);
    this.partitionKey = partitionKey;
  }

  private toDto(device: Device): CosmosDeviceDto {
    return {
      id: device.id,
      name: device.name,
      description: device.description,
      count: device.count,
      updatedAt: device.updatedAt.toISOString(),
    };
  }

  private toDomain(dto: CosmosDeviceDto): Device {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      count: dto.count,
      updatedAt: new Date(dto.updatedAt),
    };
  }

  private partitionValueForDto(dtoOrId: any) {
    if (this.partitionKey === 'id') return dtoOrId.id;
    return dtoOrId[this.partitionKey] ?? dtoOrId.id;
  }

  async getById(id: string): Promise<Device | null> {
    try {
      const pk = this.partitionKey === 'id' ? id : id;
      const { resource } = await this.container
        .item(id, pk)
        .read<CosmosDeviceDto>();
      if (!resource) return null;
      return this.toDomain(resource);
    } catch (err: any) {
      if (err?.code === 404 || err?.statusCode === 404) return null;
      throw err;
    }
  }

  async list(): Promise<Device[]> {
    const iterator = this.container.items.readAll<CosmosDeviceDto>();
    const { resources } = await iterator.fetchAll();
    return resources.map((r) => this.toDomain(r));
  }

  async save(device: Device): Promise<Device> {
    const dto = this.toDto(device);
    const pk = this.partitionValueForDto(dto);
    const { resource } = await this.container.items.upsert<CosmosDeviceDto>(
      dto as any,
      { partitionKey: pk } as any
    );
    if (!resource) throw new Error('Failed to upsert device');
    return this.toDomain(resource);
  }

  async delete(id: string): Promise<void> {
    try {
      const pk = this.partitionKey === 'id' ? id : id;
      await this.container.item(id, pk).delete();
    } catch (err: any) {
      if (err?.code === 404 || err?.statusCode === 404) return;
      throw err;
    }
  }
}
