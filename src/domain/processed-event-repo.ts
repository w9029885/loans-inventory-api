export type ProcessedEventRecord = {
  id: string;
  processedAt: Date;
  type?: string;
  subject?: string;
};

export interface ProcessedEventRepo {
  has(eventId: string): Promise<boolean>;
  markProcessed(record: ProcessedEventRecord): Promise<void>;
}
