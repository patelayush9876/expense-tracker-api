import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentsRepository } from './repositories/investments.repository';
import { RedisService } from '@/providers/redis/redis.service';
import { ActivityLogsService } from '@/modules/activity-logs/activity-logs.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly repository: InvestmentsRepository,
    private readonly redisService: RedisService,
    private readonly activityLogService: ActivityLogsService,
    private readonly prisma: PrismaService,
  ) {}

  private mapInvestment(inv: any) {
    const amountInvested = Number(inv.amountInvested);
    const currentValue = Number(inv.currentValue);
    const quantity = inv.quantity ? Number(inv.quantity) : null;
    const profitLoss = currentValue - amountInvested;
    const profitLossPercentage =
      amountInvested > 0 ? (profitLoss / amountInvested) * 100 : 0;

    return {
      ...inv,
      amountInvested,
      currentValue,
      quantity,
      profitLoss,
      profitLossPercentage,
    };
  }

  private async fetchJson(url: string, timeoutMs = 5000): Promise<any> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async syncPrices(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: {
        userId,
        symbol: { not: null },
      },
    });

    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    const currency = settings?.currency || 'INR';

    let syncedCount = 0;

    for (const inv of investments) {
      if (!inv.symbol) continue;
      try {
        let unitPrice: number | null = null;
        const symbol = inv.symbol.trim();

        if (inv.type === 'CRYPTO') {
          const data = await this.fetchJson(
            `https://api.coinbase.com/v2/prices/${symbol.toUpperCase()}-${currency.toUpperCase()}/spot`
          );
          if (data?.data?.amount) {
            unitPrice = parseFloat(data.data.amount);
          }
        } else if (inv.type === 'STOCKS') {
          const data = await this.fetchJson(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
          );
          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price !== undefined) {
            unitPrice = price;
          }
        } else if (inv.type === 'MUTUAL_FUND') {
          const data = await this.fetchJson(`https://api.mfapi.in/mf/${symbol}`);
          const nav = data?.data?.[0]?.nav;
          if (nav) {
            unitPrice = parseFloat(nav);
          }
        }

        if (unitPrice !== null && unitPrice > 0) {
          const quantity = inv.quantity ? Number(inv.quantity) : 1;
          const newCurrentValue = unitPrice * quantity;

          await this.repository.update(inv.id, {
            currentValue: newCurrentValue,
          });
          syncedCount++;
        }
      } catch (err) {
        console.error(`Failed to sync price for ${inv.name} (${inv.symbol}):`, err.message);
      }
    }

    if (syncedCount > 0) {
      await this.redisService.delPattern(`dashboard:*:${userId}`);
      await this.redisService.delPattern(`analytics:*:${userId}`);

      await this.activityLogService.log(userId, 'Investments Synced', {
        count: syncedCount,
      });
    }

    return { success: true, syncedCount };
  }

  async create(userId: string, dto: CreateInvestmentDto) {
    const investment = await this.repository.create({
      name: dto.name,
      type: dto.type,
      amountInvested: dto.amountInvested,
      currentValue: dto.currentValue,
      purchaseDate: new Date(dto.purchaseDate),
      symbol: dto.symbol,
      quantity: dto.quantity,
      notes: dto.notes,
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
      symbol: dto.symbol,
      quantity: dto.quantity,
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
