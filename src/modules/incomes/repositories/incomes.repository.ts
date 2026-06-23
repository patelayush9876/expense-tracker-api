import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, Income } from '@prisma/client';
import { QueryIncomeDto } from '../dto/query-income.dto';

@Injectable()
export class IncomesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.IncomeUncheckedCreateInput): Promise<Income> {
    return this.prisma.income.create({
      data,
    });
  }

  async findMany(userId: string, query: QueryIncomeDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      startDate,
      endDate,
      sortBy,
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.IncomeWhereInput = {
      userId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.incomeDate = {};
      if (startDate) {
        where.incomeDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.incomeDate.lte = new Date(endDate);
      }
    }

    const orderByKey = sortBy || 'incomeDate';
    const orderBy = {
      [orderByKey]: sortOrder.toLowerCase() as Prisma.SortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { category: true },
      }),
      this.prisma.income.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Income | null> {
    return this.prisma.income.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async update(
    id: string,
    data: Prisma.IncomeUncheckedUpdateInput,
  ): Promise<Income> {
    return this.prisma.income.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Income> {
    return this.prisma.income.delete({
      where: { id },
    });
  }

  async getMonthlyAggregation(userId: string) {
    const incomes = await this.prisma.income.findMany({
      where: { userId },
      select: {
        amount: true,
        incomeDate: true,
      },
    });

    const groups: { [key: string]: number } = {};

    incomes.forEach((inc) => {
      const date = new Date(inc.incomeDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      groups[key] = (groups[key] || 0) + Number(inc.amount);
    });

    return Object.keys(groups)
      .map((key) => {
        const [year, month] = key.split('-');
        return {
          year: parseInt(year),
          month: parseInt(month),
          total: groups[key],
        };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }
}
