import { CosmosClient, Container } from '@azure/cosmos';
import { ProcessedEventRecord, ProcessedEventRepo } from '../domain/processed-event-repo';

type Options = {
  endpoint: string;
  databaseId: string;
  containerId: string;
  /** Optional access key for key-based auth */
  key?: string;
  /** Partition key field name (without leading slash). Defaults to `id`. */
  partitionKey?: string;
};

type CosmosProcessedEventDto = {
  id: string;
  processedAt: string;
  type?: string;
  subject?: string;
};

export class CosmosProcessedEventRepo implements ProcessedEventRepo {
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

    const clientOptions = (key ? { endpoint, key } : { endpoint }) as any;
    this.client = new CosmosClient(clientOptions);
    this.container = this.client.database(databaseId).container(containerId);
    this.partitionKey = partitionKey;
  }

  private toDto(record: ProcessedEventRecord): CosmosProcessedEventDto {
    return {
      id: record.id,
      processedAt: record.processedAt.toISOString(),
      type: record.type,
      subject: record.subject,
    };
  }

  private partitionValueForDto(dtoOrId: any) {
    if (this.partitionKey === 'id') return dtoOrId.id;
    return dtoOrId[this.partitionKey] ?? dtoOrId.id;
  }

  async has(eventId: string): Promise<boolean> {
    try {
      const pk = this.partitionKey === 'id' ? eventId : eventId;
      const { resource } = await this.container
        .item(eventId, pk)
        .read<CosmosProcessedEventDto>();
      return !!resource;
    } catch (err: any) {
      if (err?.code === 404 || err?.statusCode === 404) return false;
      throw err;
    }
  }

  async markProcessed(record: ProcessedEventRecord): Promise<void> {
    const dto = this.toDto(record);
    const pk = this.partitionValueForDto(dto);
    await this.container.items.upsert(dto as any, { partitionKey: pk } as any);
  }
}
