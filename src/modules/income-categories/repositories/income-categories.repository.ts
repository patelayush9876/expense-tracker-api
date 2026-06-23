import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, IncomeCategory } from '@prisma/client';

@Injectable()
export class IncomeCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.IncomeCategoryUncheckedCreateInput,
  ): Promise<IncomeCategory> {
    return this.prisma.incomeCategory.create({
      data,
    });
  }

  async findAll(userId: string): Promise<IncomeCategory[]> {
    return this.prisma.incomeCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<IncomeCategory | null> {
    return this.prisma.incomeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { incomes: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.IncomeCategoryUpdateInput,
  ): Promise<IncomeCategory> {
    return this.prisma.incomeCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<IncomeCategory> {
    return this.prisma.incomeCategory.delete({
      where: { id },
    });
  }
}
