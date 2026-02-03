import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RawFeed, RawFeedSchema } from './raw-feed.schema';
import { RawFeedsService } from './raw-feeds.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: RawFeed.name, schema: RawFeedSchema }])],
  providers: [RawFeedsService],
  exports: [RawFeedsService]
})
export class RawFeedsModule {}
