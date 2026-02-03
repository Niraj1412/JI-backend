import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobDocument = HydratedDocument<Job>;

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ required: true })
  source!: string;

  @Prop({ required: true })
  sourceUrl!: string;

  @Prop({ required: true })
  externalId!: string;

  @Prop()
  guid?: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  company?: string;

  @Prop()
  location?: string;

  @Prop({ type: [String], default: [] })
  categories!: string[];

  @Prop({ type: [String], default: [] })
  jobType!: string[];

  @Prop()
  url?: string;

  @Prop()
  publishedAt?: Date;

  @Prop({ type: Object })
  raw?: Record<string, unknown>;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ source: 1, externalId: 1 }, { unique: true });
JobSchema.index({ publishedAt: -1 });
