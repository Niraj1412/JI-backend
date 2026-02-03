import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RawFeed, RawFeedDocument } from './raw-feed.schema';

@Injectable()
export class RawFeedsService {
  constructor(@InjectModel(RawFeed.name) private readonly rawFeedModel: Model<RawFeedDocument>) {}

  async store(params: {
    sourceUrl: string;
    fetchedAt: Date;
    itemsCount: number;
    rawXml?: string;
    rawJson?: Record<string, unknown>;
    importLogId?: string;
  }): Promise<void> {
    await this.rawFeedModel.create({
      sourceUrl: params.sourceUrl,
      fetchedAt: params.fetchedAt,
      itemsCount: params.itemsCount,
      rawXml: params.rawXml,
      rawJson: params.rawJson,
      importLogId: params.importLogId ? new Types.ObjectId(params.importLogId) : undefined
    });
  }
}
