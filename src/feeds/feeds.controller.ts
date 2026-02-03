import { Controller, Post } from '@nestjs/common';
import { FeedsService } from './feeds.service';

@Controller('import-logs')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Post('run')
  async runImport() {
    await this.feedsService.runImport();
    return { status: 'started' };
  }
}
