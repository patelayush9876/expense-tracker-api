import { Injectable } from '@nestjs/common';
import { ActivityLogsRepository } from './repositories/activity-logs.repository';
import { ActivityLog } from '@prisma/client';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly repository: ActivityLogsRepository) {}

  async log(userId: string, action: string, metadata?: any): Promise<void> {
    await this.repository.create({
      userId,
      action,
      metadata: metadata || undefined,
    });
  }

  async findAll(userId: string): Promise<ActivityLog[]> {
    return this.repository.findMany(userId);
  }
}
