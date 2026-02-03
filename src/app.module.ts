import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { envValidationSchema } from './config/env.validation';
import { FeedsModule } from './feeds/feeds.module';
import { JobsModule } from './jobs/jobs.module';
import { ImportLogsModule } from './import-logs/import-logs.module';
import { RawFeedsModule } from './raw-feeds/raw-feeds.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema
    }),
    HttpModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI')
      })
    }),
    QueuesModule,
    JobsModule,
    ImportLogsModule,
    RawFeedsModule,
    FeedsModule
  ]
})
export class AppModule {}
