import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportLog, ImportLogSchema } from './import-log.schema';
import { ImportLogsService } from './import-logs.service';
import { ImportLogsController } from './import-logs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ImportLog.name, schema: ImportLogSchema }])],
  providers: [ImportLogsService],
  controllers: [ImportLogsController],
  exports: [ImportLogsService]
})
export class ImportLogsModule {}
