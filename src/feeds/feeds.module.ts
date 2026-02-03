import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FeedsService } from './feeds.service';
import { XmlParserService } from './xml-parser.service';
import { JobNormalizerService } from './job-normalizer.service';
import { RawFeedsModule } from '../raw-feeds/raw-feeds.module';
import { ImportLogsModule } from '../import-logs/import-logs.module';
import { QueuesModule } from '../queues/queues.module';
import { FeedsController } from './feeds.controller';

@Module({
  imports: [HttpModule, RawFeedsModule, ImportLogsModule, QueuesModule],
  providers: [FeedsService, XmlParserService, JobNormalizerService],
  controllers: [FeedsController],
  exports: [FeedsService]
})
export class FeedsModule {}
