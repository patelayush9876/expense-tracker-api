import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository } from './repositories/expenses.repository';
import { ExpenseCategoriesService } from '@/modules/expense-categories/expense-categories.service';
import { RedisService } from '@/providers/redis/redis.service';
import { ActivityLogsService } from '@/modules/activity-logs/activity-logs.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { Expense } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly categoryService: ExpenseCategoriesService,
    private readonly redisService: RedisService,
    private readonly activityLogService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    await this.categoryService.findById(userId, dto.categoryId);

    const expense = await this.repository.create({
      ...dto,
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      userId,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Expense Created', {
      expenseId: expense.id,
      title: expense.title,
      amount: expense.amount,
    });

    // Run budget check asynchronously
    this.checkBudgetWarning(userId).catch((err) => {
      console.error('Error running budget warning check:', err);
    });

    return expense;
  }

  async findMany(userId: string, query: QueryExpenseDto) {
    return this.repository.findMany(userId, query);
  }

  async findById(userId: string, id: string): Promise<Expense> {
    const expense = await this.repository.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    await this.findById(userId, id);

    if (dto.categoryId) {
      await this.categoryService.findById(userId, dto.categoryId);
    }

    const updated = await this.repository.update(id, {
      title: dto.title,
      amount: dto.amount,
      description: dto.description,
      categoryId: dto.categoryId,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      receiptUrl: dto.receiptUrl,
      creditCardId: dto.creditCardId,
      excludeFromAnalytics: dto.excludeFromAnalytics,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    this.checkBudgetWarning(userId).catch((err) => {
      console.error('Error running budget warning check:', err);
    });

    return updated;
  }

  async remove(userId: string, id: string): Promise<Expense> {
    const expense = await this.findById(userId, id);
    const deleted = await this.repository.delete(id);

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Expense Deleted', {
      expenseId: expense.id,
      title: expense.title,
      amount: expense.amount,
    });

    return deleted;
  }

  private async checkBudgetWarning(userId: string): Promise<void> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [incomeSum, expenseSum] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, incomeDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          userId,
          expenseDate: { gte: startOfMonth, lte: endOfMonth },
          excludeFromAnalytics: false,
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpense = Number(expenseSum._sum.amount || 0);

    if (totalIncome > 0) {
      const percentage = (totalExpense / totalIncome) * 100;
      if (percentage >= 80) {
        await this.notificationsService.create(
          userId,
          'Budget Warning',
          `Your monthly expenses have reached ${percentage.toFixed(1)}% of your monthly income (Spent: $${totalExpense.toFixed(2)} of $${totalIncome.toFixed(2)}).`,
        );
      }
    }
  }
}
