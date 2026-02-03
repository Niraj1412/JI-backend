import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { JobsService, NormalizedJob } from '../../jobs/jobs.service';
import { ImportLogsService } from '../../import-logs/import-logs.service';
import { JOBS_QUEUE } from '../queues.constants';

const parsedConcurrency = Number.parseInt(process.env.QUEUE_CONCURRENCY ?? '10', 10);
const WORKER_CONCURRENCY = Number.isFinite(parsedConcurrency) && parsedConcurrency > 0 ? parsedConcurrency : 10;

export interface JobUpsertPayload {
  importLogId: string;
  job: NormalizedJob;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

@Processor(JOBS_QUEUE, { concurrency: WORKER_CONCURRENCY })
export class JobUpsertProcessor extends WorkerHost {
  private readonly logger = new Logger(JobUpsertProcessor.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly importLogsService: ImportLogsService
  ) {
    super();
  }

  async process(job: BullJob<JobUpsertPayload>): Promise<void> {
    const { importLogId, job: normalizedJob } = job.data ?? {};

    try {
      if (!importLogId || !normalizedJob) {
        throw new ValidationError('Missing importLogId or job payload');
      }

      if (!normalizedJob.externalId || !normalizedJob.source || !normalizedJob.title) {
        throw new ValidationError('Job payload missing required identifiers');
      }

      const result = await this.jobsService.upsertJob(normalizedJob);
      await this.importLogsService.recordSuccess(importLogId, result.isNew, result.isUpdated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const isValidationError = error instanceof ValidationError;
      const attempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= attempts;

      if (isValidationError) {
        await job.discard();
      }

      if ((isValidationError || isFinalAttempt) && importLogId) {
        await this.importLogsService.recordFailure(importLogId, {
          jobId: normalizedJob?.externalId,
          reason: message
        });
      }

      this.logger.warn(`Job ${job.id} failed: ${message}`);
      throw error;
    }
  }
}
