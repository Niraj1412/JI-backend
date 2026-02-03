import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FEED_URLS } from './feeds.constants';
import { XmlParserService } from './xml-parser.service';
import { JobNormalizerService } from './job-normalizer.service';
import { RawFeedsService } from '../raw-feeds/raw-feeds.service';
import { ImportLogsService } from '../import-logs/import-logs.service';
import { chunkArray } from '../utils/array.utils';
import { JOBS_QUEUE, JOBS_QUEUE_JOB } from '../queues/queues.constants';
import { NormalizedJob } from '../jobs/jobs.service';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  private isRunning = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly xmlParser: XmlParserService,
    private readonly normalizer: JobNormalizerService,
    private readonly rawFeedsService: RawFeedsService,
    private readonly importLogsService: ImportLogsService,
    @InjectQueue(JOBS_QUEUE) private readonly jobsQueue: Queue
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    if (!this.config.get<boolean>('CRON_ENABLED')) {
      return;
    }

    if (this.isRunning) {
      this.logger.warn('Previous import still running. Skipping this tick.');
      return;
    }

    this.isRunning = true;
    try {
      await this.runImport();
    } finally {
      this.isRunning = false;
    }
  }

  async runImport(): Promise<void> {
    for (const feedUrl of FEED_URLS) {
      try {
        await this.importSingleFeed(feedUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to import feed ${feedUrl}: ${message}`);
      }
    }
  }

  private async importSingleFeed(feedUrl: string): Promise<void> {
    let importLogId: string | undefined;

    try {
      const response = await this.httpService.axiosRef.get(feedUrl, {
        responseType: 'text',
        timeout: 30000
      });

      const rawXml = response.data as string;
      const parsed = await this.xmlParser.parse(rawXml);
      const items = this.xmlParser.extractItems(parsed);

      const importLog = await this.importLogsService.createLog(feedUrl, items.length);
      importLogId = importLog.id;

      if (this.config.get<boolean>('STORE_RAW_FEED')) {
        await this.rawFeedsService.store({
          sourceUrl: feedUrl,
          fetchedAt: new Date(),
          itemsCount: items.length,
          rawXml,
          rawJson: parsed,
          importLogId
        });
      }

      const normalizedJobs: NormalizedJob[] = [];
      const failures: { jobId?: string; reason: string }[] = [];

      for (const item of items) {
        const normalized = this.normalizer.normalize(item, feedUrl);
        if (!normalized) {
          failures.push({ reason: 'Missing title or unique identifier' });
          continue;
        }

        normalizedJobs.push(normalized);
      }

      if (failures.length && importLogId) {
        await this.importLogsService.recordBulkFailures(importLogId, failures);
      }

      if (!normalizedJobs.length) {
        return;
      }

      if (importLogId) {
        await this.enqueueJobs(importLogId, normalizedJobs);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (importLogId) {
        await this.importLogsService.markFeedFailure(importLogId, message);
      } else {
        await this.importLogsService.createFailedLog(feedUrl, message);
      }
      throw error;
    }
  }

  private async enqueueJobs(importLogId: string, jobs: NormalizedJob[]): Promise<void> {
    const batchSize = this.config.get<number>('JOB_BATCH_SIZE', 200);
    const chunks = chunkArray(jobs, batchSize);

    for (const chunk of chunks) {
      await this.jobsQueue.addBulk(
        chunk.map((job) => ({
          name: JOBS_QUEUE_JOB,
          data: {
            importLogId,
            job
          },
          opts: {
            jobId: `${importLogId}:${job.externalId}`
          }
        }))
      );
    }
  }
}
