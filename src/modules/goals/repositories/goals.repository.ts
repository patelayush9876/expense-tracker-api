import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, Goal } from '@prisma/client';

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GoalUncheckedCreateInput): Promise<Goal> {
    return this.prisma.goal.create({
      data,
    });
  }

  async findMany(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' },
    });
  }

  async findById(id: string): Promise<Goal | null> {
    return this.prisma.goal.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal> {
    return this.prisma.goal.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Goal> {
    return this.prisma.goal.delete({
      where: { id },
    });
  }
}
