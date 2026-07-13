import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma, CreditCard } from '@prisma/client';

@Injectable()
export class CreditCardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CreditCardUncheckedCreateInput): Promise<CreditCard> {
    return this.prisma.creditCard.create({
      data,
    });
  }

  async findMany(userId: string): Promise<any[]> {
    return this.prisma.creditCard.findMany({
      where: { userId },
      include: {
        expenses: {
          select: {
            amount: true,
            excludeFromAnalytics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.creditCard.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { expenseDate: 'desc' },
          include: { category: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.CreditCardUpdateInput,
  ): Promise<CreditCard> {
    return this.prisma.creditCard.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<CreditCard> {
    return this.prisma.creditCard.delete({
      where: { id },
    });
  }
}
