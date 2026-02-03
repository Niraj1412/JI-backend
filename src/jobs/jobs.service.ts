import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateResult } from 'mongoose';
import { Job, JobDocument } from './job.schema';
import { compactObject } from '../utils/text.utils';

export interface NormalizedJob {
  source: string;
  sourceUrl: string;
  externalId: string;
  guid?: string;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  categories?: string[];
  jobType?: string[];
  url?: string;
  publishedAt?: Date;
  raw?: Record<string, unknown>;
}

export interface UpsertResult {
  isNew: boolean;
  isUpdated: boolean;
}

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private readonly jobModel: Model<JobDocument>) {}

  async upsertJob(job: NormalizedJob): Promise<UpsertResult> {
    const filter = { source: job.source, externalId: job.externalId };
    const update = {
      $set: compactObject({
        source: job.source,
        sourceUrl: job.sourceUrl,
        externalId: job.externalId,
        guid: job.guid,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        categories: job.categories ?? [],
        jobType: job.jobType ?? [],
        url: job.url,
        publishedAt: job.publishedAt,
        raw: job.raw
      })
    };

    const result: UpdateResult = await this.jobModel.updateOne(filter, update, {
      upsert: true
    });

    const isNew = (result.upsertedCount ?? 0) > 0;
    const isUpdated = !isNew && (result.modifiedCount ?? 0) > 0;

    return { isNew, isUpdated };
  }
}
