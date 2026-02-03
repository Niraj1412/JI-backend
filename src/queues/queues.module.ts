import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JOBS_QUEUE } from './queues.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        prefix: config.get<string>('REDIS_PREFIX'),
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          username: config.get<string>('REDIS_USERNAME'),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: config.get<number>('REDIS_DB'),
          ...(config.get<boolean>('REDIS_TLS') ? { tls: {} } : {})
        }
      })
    }),
    BullModule.registerQueueAsync({
      name: JOBS_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        defaultJobOptions: {
          attempts: config.get<number>('JOB_RETRY_ATTEMPTS'),
          backoff: {
            type: 'exponential',
            delay: config.get<number>('JOB_RETRY_BACKOFF_MS')
          },
          removeOnComplete: true,
          removeOnFail: false
        }
      })
    })
  ],
  providers: [],
  exports: [BullModule]
})
export class QueuesModule {}
