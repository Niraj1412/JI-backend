import { Controller, Get, Query } from '@nestjs/common';
import { ImportLogsService } from './import-logs.service';
import { ImportLogsQueryDto } from './import-logs-query.dto';

@Controller('import-logs')
export class ImportLogsController {
  constructor(private readonly importLogsService: ImportLogsService) {}

  @Get()
  async list(@Query() query: ImportLogsQueryDto) {
    return this.importLogsService.list(query);
  }
}
