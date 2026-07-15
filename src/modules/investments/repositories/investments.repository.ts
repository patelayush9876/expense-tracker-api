import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, Investment } from '@prisma/client';
import { QueryInvestmentDto } from '../dto/query-investment.dto';

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InvestmentUncheckedCreateInput,
  ): Promise<Investment> {
    return this.prisma.investment.create({
      data,
    });
  }

  async findMany(userId: string, query: QueryInvestmentDto) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      sortBy,
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentWhereInput = {
      userId,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    const orderByKey = sortBy || 'purchaseDate';
    const orderBy = {
      [orderByKey]: sortOrder.toLowerCase() as Prisma.SortOrder,
    };

    const [items, total, sumAggregation, typeGroup] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.investment.count({ where }),
      this.prisma.investment.aggregate({
        where,
        _sum: {
          currentValue: true,
          amountInvested: true,
        },
      }),
      this.prisma.investment.groupBy({
        by: ['type'],
        where,
        _sum: {
          currentValue: true,
        },
      }),
    ]);

    const totalCurrentValue = Number(sumAggregation._sum.currentValue || 0);
    const totalAmountInvested = Number(sumAggregation._sum.amountInvested || 0);

    const byType: Record<string, number> = {};
    typeGroup.forEach((g) => {
      byType[g.type] = Number(g._sum.currentValue || 0);
    });

    return {
      items,
      total,
      totalCurrentValue,
      totalAmountInvested,
      byType,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Investment | null> {
    return this.prisma.investment.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Prisma.InvestmentUpdateInput,
  ): Promise<Investment> {
    return this.prisma.investment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Investment> {
    return this.prisma.investment.delete({
      where: { id },
    });
  }

  async getSummary(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;

    investments.forEach((inv) => {
      totalInvested += Number(inv.amountInvested);
      totalCurrentValue += Number(inv.currentValue);
    });

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercentage =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercentage,
    };
  }

  async getPortfolioAllocation(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    const allocationMap: { [key: string]: number } = {};
    let totalValue = 0;

    investments.forEach((inv) => {
      const val = Number(inv.currentValue);
      allocationMap[inv.type] = (allocationMap[inv.type] || 0) + val;
      totalValue += val;
    });

    return Object.keys(allocationMap).map((type) => {
      const amount = allocationMap[type];
      return {
        type,
        amount,
        percentage: totalValue > 0 ? (amount / totalValue) * 100 : 0,
      };
    });
  }
}
