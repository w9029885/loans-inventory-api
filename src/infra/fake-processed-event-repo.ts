import { ProcessedEventRecord, ProcessedEventRepo } from '../domain/processed-event-repo';

export class FakeProcessedEventRepo implements ProcessedEventRepo {
  private readonly processed = new Set<string>();

  async has(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessed(record: ProcessedEventRecord): Promise<void> {
    this.processed.add(record.id);
  }
}
