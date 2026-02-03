import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RawFeedDocument = HydratedDocument<RawFeed>;

@Schema({ timestamps: true, collection: 'feed_raws' })
export class RawFeed {
  @Prop({ required: true })
  sourceUrl!: string;

  @Prop({ type: Types.ObjectId })
  importLogId?: Types.ObjectId;

  @Prop({ required: true })
  fetchedAt!: Date;

  @Prop()
  itemsCount?: number;

  @Prop()
  rawXml?: string;

  @Prop({ type: Object })
  rawJson?: Record<string, unknown>;
}

export const RawFeedSchema = SchemaFactory.createForClass(RawFeed);
RawFeedSchema.index({ sourceUrl: 1, fetchedAt: -1 });
