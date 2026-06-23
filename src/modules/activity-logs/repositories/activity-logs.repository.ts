import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, ActivityLog } from '@prisma/client';

@Injectable()
export class ActivityLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.ActivityLogUncheckedCreateInput,
  ): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data,
    });
  }

  async findMany(userId: string): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
