import { Injectable, NotFoundException } from '@nestjs/common';
import { CreditCardsRepository } from './repositories/credit-cards.repository';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { RedisService } from '@/providers/redis/redis.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { CreditCard } from '@prisma/client';

@Injectable()
export class CreditCardsService {
  constructor(
    private readonly repository: CreditCardsRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(userId: string, dto: CreateCreditCardDto): Promise<CreditCard> {
    const card = await this.repository.create({
      ...dto,
      userId,
    });
    await this.redisService.delPattern(`dashboard:*:${userId}`);
    return card;
  }

  async findAll(userId: string) {
    const cards = await this.repository.findMany(userId);
    return cards.map((card) => this.mapCard(card));
  }

  async findById(userId: string, id: string) {
    const card = await this.repository.findById(id);
    if (!card || card.userId !== userId) {
      throw new NotFoundException(`Credit Card with ID ${id} not found`);
    }
    return this.mapCard(card);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCreditCardDto,
  ): Promise<CreditCard> {
    await this.findById(userId, id);
    const card = await this.repository.update(id, dto);
    await this.redisService.delPattern(`dashboard:*:${userId}`);
    return card;
  }

  async remove(userId: string, id: string): Promise<CreditCard> {
    await this.findById(userId, id);
    const card = await this.repository.delete(id);
    await this.redisService.delPattern(`dashboard:*:${userId}`);
    return card;
  }

  async payBill(userId: string, id: string, dto: PayBillDto) {
    const card = await this.findById(userId, id);

    // Find or create 'Credit Card Bill' category
    let category = await this.prisma.expenseCategory.findFirst({
      where: {
        userId,
        name: { equals: 'Credit Card Bill', mode: 'insensitive' },
      },
    });

    if (!category) {
      category = await this.prisma.expenseCategory.create({
        data: {
          name: 'Credit Card Bill',
          userId,
        },
      });
    }

    // Create a special expense representing the bill payment
    const payment = await this.prisma.expense.create({
      data: {
        title: `Bill Payment — ${card.name}`,
        amount: dto.amount,
        expenseDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        categoryId: category.id,
        userId,
        excludeFromAnalytics: true, // EXCLUDE from analytics to prevent double-counting
      },
    });

    // Clear caches
    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);

    return payment;
  }

  private mapCard(card: any) {
    const outstandingBalance = (card.expenses || [])
      .filter((exp: any) => !exp.excludeFromAnalytics)
      .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);

    const availableLimit = Math.max(0, Number(card.limit) - outstandingBalance);

    return {
      ...card,
      limit: Number(card.limit),
      outstandingBalance,
      availableLimit,
    };
  }
}
