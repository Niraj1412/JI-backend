import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { envValidationSchema } from './config/env.validation';
import { JobsModule } from './jobs/jobs.module';
import { ImportLogsModule } from './import-logs/import-logs.module';
import { QueuesModule } from './queues/queues.module';
import { JobUpsertProcessor } from './queues/processors/job-upsert.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI')
      })
    }),
    QueuesModule,
    JobsModule,
    ImportLogsModule
  ],
  providers: [JobUpsertProcessor]
})
export class WorkerModule {}
