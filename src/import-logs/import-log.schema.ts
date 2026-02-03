import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export interface FailedReason {
  jobId?: string;
  reason: string;
}

export type ImportLogDocument = HydratedDocument<ImportLog>;

@Schema({ timestamps: true, collection: 'import_logs' })
export class ImportLog {
  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ default: 0 })
  totalFetched!: number;

  @Prop({ default: 0 })
  totalImported!: number;

  @Prop({ default: 0 })
  newJobs!: number;

  @Prop({ default: 0 })
  updatedJobs!: number;

  @Prop({ default: 0 })
  failedJobs!: number;

  @Prop({ type: [{ jobId: String, reason: String }], default: [] })
  failedReasons!: FailedReason[];

  @Prop({ default: 'running' })
  status!: string;

  @Prop({ default: 0 })
  processedJobs!: number;

  @Prop()
  completedAt?: Date;
}

export const ImportLogSchema = SchemaFactory.createForClass(ImportLog);
ImportLogSchema.index({ timestamp: -1 });
ImportLogSchema.index({ fileName: 1, timestamp: -1 });
