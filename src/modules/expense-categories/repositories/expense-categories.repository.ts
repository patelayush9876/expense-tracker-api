import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpenseCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.ExpenseCategoryUncheckedCreateInput,
  ): Promise<ExpenseCategory> {
    return this.prisma.expenseCategory.create({
      data,
    });
  }

  async findAll(userId: string): Promise<ExpenseCategory[]> {
    return this.prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ExpenseCategory | null> {
    return this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ExpenseCategoryUpdateInput,
  ): Promise<ExpenseCategory> {
    return this.prisma.expenseCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ExpenseCategory> {
    return this.prisma.expenseCategory.delete({
      where: { id },
    });
  }
}
