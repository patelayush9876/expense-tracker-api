import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, Expense } from '@prisma/client';
import { QueryExpenseDto } from '../dto/query-expense.dto';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return this.prisma.expense.create({
      data,
    });
  }

  async findMany(userId: string, query: QueryExpenseDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      creditCardId,
      startDate,
      endDate,
      sortBy,
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
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

    if (creditCardId) {
      where.creditCardId = creditCardId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate);
      }
    }

    const orderByKey = sortBy || 'expenseDate';
    const orderBy = {
      [orderByKey]: sortOrder.toLowerCase() as Prisma.SortOrder,
    };

    const [items, total, sumAggregation] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { category: true, creditCard: true },
      }),
      this.prisma.expense.count({ where }),
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalAmount = Number(sumAggregation._sum.amount || 0);

    return {
      items,
      total,
      totalAmount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({
      where: { id },
      include: { category: true, creditCard: true },
    });
  }

  async update(
    id: string,
    data: Prisma.ExpenseUncheckedUpdateInput,
  ): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Expense> {
    return this.prisma.expense.delete({
      where: { id },
    });
  }
}
