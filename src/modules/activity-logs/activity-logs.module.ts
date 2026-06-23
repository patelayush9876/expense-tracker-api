import { Global, Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsRepository } from './repositories/activity-logs.repository';
import { ActivityLogsController } from './activity-logs.controller';

@Global()
@Module({
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogsRepository],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
