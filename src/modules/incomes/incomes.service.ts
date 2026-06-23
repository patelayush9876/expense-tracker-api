import { Injectable, NotFoundException } from '@nestjs/common';
import { IncomesRepository } from './repositories/incomes.repository';
import { IncomeCategoriesService } from '@/modules/income-categories/income-categories.service';
import { RedisService } from '@/providers/redis/redis.service';
import { ActivityLogsService } from '@/modules/activity-logs/activity-logs.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { Income } from '@prisma/client';

@Injectable()
export class IncomesService {
  constructor(
    private readonly repository: IncomesRepository,
    private readonly categoryService: IncomeCategoriesService,
    private readonly redisService: RedisService,
    private readonly activityLogService: ActivityLogsService,
  ) {}

  async create(userId: string, dto: CreateIncomeDto): Promise<Income> {
    await this.categoryService.findById(userId, dto.categoryId);

    const income = await this.repository.create({
      ...dto,
      amount: dto.amount,
      incomeDate: new Date(dto.incomeDate),
      userId,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Income Created', {
      incomeId: income.id,
      title: income.title,
      amount: income.amount,
    });

    return income;
  }

  async findMany(userId: string, query: QueryIncomeDto) {
    return this.repository.findMany(userId, query);
  }

  async findById(userId: string, id: string): Promise<Income> {
    const income = await this.repository.findById(id);
    if (!income || income.userId !== userId) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }
    return income;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateIncomeDto,
  ): Promise<Income> {
    await this.findById(userId, id);

    if (dto.categoryId) {
      await this.categoryService.findById(userId, dto.categoryId);
    }

    const updated = await this.repository.update(id, {
      title: dto.title,
      amount: dto.amount,
      description: dto.description,
      categoryId: dto.categoryId,
      incomeDate: dto.incomeDate ? new Date(dto.incomeDate) : undefined,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    return updated;
  }

  async remove(userId: string, id: string): Promise<Income> {
    const income = await this.findById(userId, id);
    const deleted = await this.repository.delete(id);

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Income Deleted', {
      incomeId: income.id,
      title: income.title,
      amount: income.amount,
    });

    return deleted;
  }

  async getMonthlyAggregation(userId: string) {
    return this.repository.getMonthlyAggregation(userId);
  }
}
