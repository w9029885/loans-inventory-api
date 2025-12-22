import { CosmosClient, Container } from '@azure/cosmos';
import { InventoryItem } from '../domain/inventory-item';
import { InventoryItemRepo } from '../domain/inventory-item-repo';

type Options = {
  endpoint: string;
  databaseId: string;
  containerId: string;
  /** Optional access key for key-based auth */
  key?: string;
  /** Partition key field name (without leading slash). Defaults to `id`. */
  partitionKey?: string;
};

type CosmosInventoryItemDto = {
  id: string;
  name: string;
  description: string;
  status: InventoryItem['status'];
  updatedAt: string; // ISO string
};

export class CosmosInventoryItemRepo implements InventoryItemRepo {
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

  private toDto(item: InventoryItem): CosmosInventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toDomain(dto: CosmosInventoryItemDto): InventoryItem {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      updatedAt: new Date(dto.updatedAt),
    };
  }

  private partitionValueForDto(dtoOrId: any) {
    if (this.partitionKey === 'id') return dtoOrId.id;
    return dtoOrId[this.partitionKey] ?? dtoOrId.id;
  }

  async getById(id: string): Promise<InventoryItem | null> {
    try {
      const pk = this.partitionKey === 'id' ? id : id;
      const { resource } = await this.container
        .item(id, pk)
        .read<CosmosInventoryItemDto>();
      if (!resource) return null;
      return this.toDomain(resource);
    } catch (err: any) {
      if (err?.code === 404 || err?.statusCode === 404) return null;
      throw err;
    }
  }

  async list(): Promise<InventoryItem[]> {
    const iterator = this.container.items.readAll<CosmosInventoryItemDto>();
    const { resources } = await iterator.fetchAll();
    return resources.map((r) => this.toDomain(r));
  }

  async save(item: InventoryItem): Promise<InventoryItem> {
    const dto = this.toDto(item);
    const pk = this.partitionValueForDto(dto);
    const { resource } =
      await this.container.items.upsert<CosmosInventoryItemDto>(
        dto as any,
        { partitionKey: pk } as any
      );
    if (!resource) throw new Error('Failed to upsert item');
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
