import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalsRepository } from './repositories/goals.repository';
import { RedisService } from '@/providers/redis/redis.service';
import { ActivityLogsService } from '@/modules/activity-logs/activity-logs.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(
    private readonly repository: GoalsRepository,
    private readonly redisService: RedisService,
    private readonly activityLogService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getMonthlySavingsRate(userId: string): Promise<number> {
    const [incomeTotal, expenseTotal] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeTotal._sum.amount || 0);
    const totalExpense = Number(expenseTotal._sum.amount || 0);

    const firstIncome = await this.prisma.income.findFirst({
      where: { userId },
      orderBy: { incomeDate: 'asc' },
    });
    const firstExpense = await this.prisma.expense.findFirst({
      where: { userId },
      orderBy: { expenseDate: 'asc' },
    });

    const dates = [firstIncome?.incomeDate, firstExpense?.expenseDate].filter(
      Boolean,
    ) as Date[];
    if (dates.length === 0) {
      return 0;
    }

    const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const now = new Date();
    const months = Math.max(
      1,
      (now.getFullYear() - earliestDate.getFullYear()) * 12 +
        now.getMonth() -
        earliestDate.getMonth() +
        1,
    );

    return Math.max(0, (totalIncome - totalExpense) / months);
  }

  private async mapGoal(userId: string, goal: Goal, savingsRate?: number) {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    const rate =
      savingsRate !== undefined
        ? savingsRate
        : await this.getMonthlySavingsRate(userId);

    let estimatedCompletion = '';
    let suggestion = '';

    if (remainingAmount <= 0) {
      estimatedCompletion = 'Completed';
      suggestion = 'Goal achieved! Congratulations!';
    } else {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);

      // Calculate months to target date
      const monthsToTarget = Math.max(
        1,
        (targetDate.getFullYear() - now.getFullYear()) * 12 +
          targetDate.getMonth() -
          now.getMonth(),
      );

      const requiredMonthlySaving = remainingAmount / monthsToTarget;

      if (rate > 0) {
        const monthsRemaining = remainingAmount / rate;
        const estDate = new Date();
        estDate.setMonth(estDate.getMonth() + Math.ceil(monthsRemaining));
        estimatedCompletion = estDate.toISOString();
      } else {
        estimatedCompletion =
          'Off track. Zero or negative monthly savings rate.';
      }

      if (requiredMonthlySaving > rate) {
        suggestion = `To reach this goal by the target date, you need to save an additional $${(requiredMonthlySaving - rate).toFixed(2)} per month (Current monthly savings: $${rate.toFixed(2)}, Required: $${requiredMonthlySaving.toFixed(2)}).`;
      } else {
        suggestion = `You are on track! Your average monthly savings ($${rate.toFixed(2)}) is sufficient to cover the required $${requiredMonthlySaving.toFixed(2)} per month.`;
      }
    }

    return {
      ...goal,
      targetAmount,
      currentAmount,
      progressPercentage,
      estimatedCompletion,
      suggestion,
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.repository.create({
      ...dto,
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount,
      targetDate: new Date(dto.targetDate),
      userId,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Goal Created', {
      goalId: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
    });

    if (Number(goal.currentAmount) >= Number(goal.targetAmount)) {
      await this.notificationsService.create(
        userId,
        'Goal Achievement',
        `Congratulations! You have reached your financial goal: ${goal.name}!`,
      );
    }

    return this.mapGoal(userId, goal);
  }

  async findAll(userId: string) {
    const goals = await this.repository.findMany(userId);
    const savingsRate = await this.getMonthlySavingsRate(userId);
    return Promise.all(goals.map((g) => this.mapGoal(userId, g, savingsRate)));
  }

  async findById(userId: string, id: string) {
    const goal = await this.repository.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    return this.mapGoal(userId, goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.findById(userId, id);

    const updated = await this.repository.update(id, {
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      description: dto.description,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    if (
      Number(updated.currentAmount) >= Number(updated.targetAmount) &&
      Number(existing.currentAmount) < Number(existing.targetAmount)
    ) {
      await this.notificationsService.create(
        userId,
        'Goal Achievement',
        `Congratulations! You have reached your financial goal: ${updated.name}!`,
      );
    }

    return this.mapGoal(userId, updated);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    const deleted = await this.repository.delete(id);

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    return this.mapGoal(userId, deleted);
  }
}
