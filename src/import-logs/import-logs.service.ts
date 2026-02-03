import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FailedReason, ImportLog, ImportLogDocument } from './import-log.schema';
import { ImportLogsQueryDto } from './import-logs-query.dto';

export interface ListImportLogsResult {
  items: ImportLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class ImportLogsService {
  constructor(@InjectModel(ImportLog.name) private readonly importLogModel: Model<ImportLogDocument>) {}

  async createLog(fileName: string, totalFetched: number): Promise<ImportLogDocument> {
    const isEmpty = totalFetched === 0;
    return this.importLogModel.create({
      fileName,
      timestamp: new Date(),
      totalFetched,
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      failedReasons: [],
      status: isEmpty ? 'completed' : 'running',
      processedJobs: 0,
      completedAt: isEmpty ? new Date() : undefined
    });
  }

  async createFailedLog(fileName: string, reason: string): Promise<void> {
    await this.importLogModel.create({
      fileName,
      timestamp: new Date(),
      totalFetched: 0,
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 1,
      failedReasons: [{ reason }],
      status: 'failed',
      processedJobs: 1,
      completedAt: new Date()
    });
  }

  async markFeedFailure(importLogId: string, reason: string): Promise<void> {
    await this.importLogModel.updateOne(
      { _id: importLogId },
      {
        $set: { status: 'failed', completedAt: new Date() },
        $inc: { failedJobs: 1 },
        $push: { failedReasons: { reason } }
      }
    );
  }

  async recordBulkFailures(importLogId: string, failures: FailedReason[]): Promise<void> {
    if (!failures.length) {
      return;
    }

    const log = await this.importLogModel.findByIdAndUpdate(
      importLogId,
      {
        $inc: {
          failedJobs: failures.length,
          processedJobs: failures.length
        },
        $push: {
          failedReasons: { $each: failures }
        }
      },
      { new: true }
    );

    await this.markCompletedIfDone(log);
  }

  async recordSuccess(importLogId: string, isNew: boolean, isUpdated: boolean): Promise<void> {
    const inc: Record<string, number> = {
      totalImported: 1,
      processedJobs: 1
    };

    if (isNew) {
      inc.newJobs = 1;
    }

    if (isUpdated) {
      inc.updatedJobs = 1;
    }

    const log = await this.importLogModel.findByIdAndUpdate(importLogId, { $inc: inc }, { new: true });

    await this.markCompletedIfDone(log);
  }

  async recordFailure(importLogId: string, failure: FailedReason): Promise<void> {
    const log = await this.importLogModel.findByIdAndUpdate(
      importLogId,
      {
        $inc: {
          failedJobs: 1,
          processedJobs: 1
        },
        $push: {
          failedReasons: failure
        }
      },
      { new: true }
    );

    await this.markCompletedIfDone(log);
  }

  async list(query: ImportLogsQueryDto): Promise<ListImportLogsResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const filter: Record<string, unknown> = {};

    if (query.fileName) {
      filter.fileName = { $regex: escapeRegExp(query.fileName), $options: 'i' };
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.from || query.to) {
      filter.timestamp = {};
      if (query.from) {
        (filter.timestamp as Record<string, Date>).$gte = new Date(query.from);
      }
      if (query.to) {
        (filter.timestamp as Record<string, Date>).$lte = new Date(query.to);
      }
    }

    const [items, total] = await Promise.all([
      this.importLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.importLogModel.countDocuments(filter)
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    };
  }

  private async markCompletedIfDone(log?: ImportLogDocument | null): Promise<void> {
    if (!log) {
      return;
    }

    if (log.status === 'completed' || log.status === 'failed') {
      return;
    }

    if (log.processedJobs >= log.totalFetched) {
      await this.importLogModel.updateOne(
        { _id: log.id, status: { $ne: 'completed' } },
        { $set: { status: 'completed', completedAt: new Date() } }
      );
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
