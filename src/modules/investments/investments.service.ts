import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentsRepository } from './repositories/investments.repository';
import { RedisService } from '@/providers/redis/redis.service';
import { ActivityLogsService } from '@/modules/activity-logs/activity-logs.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly repository: InvestmentsRepository,
    private readonly redisService: RedisService,
    private readonly activityLogService: ActivityLogsService,
  ) {}

  private mapInvestment(inv: any) {
    const amountInvested = Number(inv.amountInvested);
    const currentValue = Number(inv.currentValue);
    const profitLoss = currentValue - amountInvested;
    const profitLossPercentage =
      amountInvested > 0 ? (profitLoss / amountInvested) * 100 : 0;

    return {
      ...inv,
      amountInvested,
      currentValue,
      profitLoss,
      profitLossPercentage,
    };
  }

  async create(userId: string, dto: CreateInvestmentDto) {
    const investment = await this.repository.create({
      ...dto,
      amountInvested: dto.amountInvested,
      currentValue: dto.currentValue,
      purchaseDate: new Date(dto.purchaseDate),
      userId,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    await this.activityLogService.log(userId, 'Investment Added', {
      investmentId: investment.id,
      name: investment.name,
      amountInvested: investment.amountInvested,
    });

    return this.mapInvestment(investment);
  }

  async findMany(userId: string, query: QueryInvestmentDto) {
    const result = await this.repository.findMany(userId, query);
    return {
      ...result,
      items: result.items.map((item) => this.mapInvestment(item)),
    };
  }

  async findById(userId: string, id: string) {
    const investment = await this.repository.findById(id);
    if (!investment || investment.userId !== userId) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }
    return this.mapInvestment(investment);
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto) {
    await this.findById(userId, id);

    const updated = await this.repository.update(id, {
      name: dto.name,
      type: dto.type,
      amountInvested: dto.amountInvested,
      currentValue: dto.currentValue,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      notes: dto.notes,
    });

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    return this.mapInvestment(updated);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    const deleted = await this.repository.delete(id);

    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    return this.mapInvestment(deleted);
  }

  async getSummary(userId: string) {
    return this.repository.getSummary(userId);
  }

  async getPortfolioAllocation(userId: string) {
    return this.repository.getPortfolioAllocation(userId);
  }
}
