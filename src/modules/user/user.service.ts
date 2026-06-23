import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { RedisService } from '@/providers/redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    if (data.username) {
      const existingUsername = await this.userRepository.findByUsername(
        data.username,
      );
      if (existingUsername) {
        throw new ConflictException('A user with this username already exists');
      }
    }

    return this.userRepository.create(data);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    // Ensure user exists
    await this.findById(id);

    if (data.email && typeof data.email === 'string') {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (data.username && typeof data.username === 'string') {
      const existingUsername = await this.userRepository.findByUsername(
        data.username,
      );
      if (existingUsername && existingUsername.id !== id) {
        throw new ConflictException('A user with this username already exists');
      }
    }

    return this.userRepository.update(id, data);
  }

  async remove(id: string): Promise<User> {
    await this.findById(id);
    return this.userRepository.delete(id);
  }

  async getSettings(userId: string) {
    const settings = await this.userRepository.findSettings(userId);
    if (!settings) {
      throw new NotFoundException(`Settings for user ${userId} not found`);
    }
    return settings;
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    await this.findById(userId);
    return this.userRepository.updateSettings(userId, data);
  }

  async seedMockData(userId: string): Promise<void> {
    await this.findById(userId);

    // Delete existing records to allow a clean overwrite seed
    await this.prisma.expense.deleteMany({ where: { userId } });
    await this.prisma.income.deleteMany({ where: { userId } });
    await this.prisma.investment.deleteMany({ where: { userId } });
    await this.prisma.goal.deleteMany({ where: { userId } });
    await this.prisma.notification.deleteMany({ where: { userId } });
    await this.prisma.activityLog.deleteMany({ where: { userId } });

    // Fetch or recreate categories
    let expenseCats = await this.prisma.expenseCategory.findMany({ where: { userId } });
    if (expenseCats.length === 0) {
      await this.prisma.expenseCategory.createMany({
        data: [
          { name: 'Housing', userId },
          { name: 'Groceries', userId },
          { name: 'Food & Dining', userId },
          { name: 'Shopping', userId },
          { name: 'Transport', userId },
          { name: 'Utilities', userId },
          { name: 'Healthcare', userId },
          { name: 'Entertainment', userId },
          { name: 'Others', userId },
        ],
      });
      expenseCats = await this.prisma.expenseCategory.findMany({ where: { userId } });
    }

    let incomeCats = await this.prisma.incomeCategory.findMany({ where: { userId } });
    if (incomeCats.length === 0) {
      await this.prisma.incomeCategory.createMany({
        data: [
          { name: 'Salary', userId },
          { name: 'Freelance', userId },
          { name: 'Investments', userId },
          { name: 'Side Business', userId },
        ],
      });
      incomeCats = await this.prisma.incomeCategory.findMany({ where: { userId } });
    }

    const expCatMap = new Map(expenseCats.map((c) => [c.name, c.id]));
    const incCatMap = new Map(incomeCats.map((c) => [c.name, c.id]));

    const now = new Date();
    const incomesData: any[] = [];
    const expensesData: any[] = [];

    // Loop over the last 6 months (5, 4, 3, 2, 1, 0 months ago)
    for (let i = 5; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;

      // 1. Incomes: Salary around the 1st
      incomesData.push({
        title: 'Monthly Salary',
        amount: new Prisma.Decimal(82000 + Math.floor(Math.random() * 8000)),
        incomeDate: new Date(year, month, 1, 10, 0, 0),
        categoryId: incCatMap.get('Salary') || incomeCats[0].id,
        userId,
      });

      // Freelance income every alternate month around the 15th
      if (i % 2 === 0) {
        incomesData.push({
          title: 'Freelance Design Retainer',
          amount: new Prisma.Decimal(12000 + Math.floor(Math.random() * 5000)),
          incomeDate: new Date(year, month, 15, 14, 0, 0),
          categoryId: incCatMap.get('Freelance') || incomeCats[1].id,
          userId,
        });
      }

      // 2. Expenses:
      // Housing (Rent)
      expensesData.push({
        title: 'Apartment Rent',
        amount: new Prisma.Decimal(18000),
        expenseDate: new Date(year, month, 3, 11, 0, 0),
        categoryId: expCatMap.get('Housing') || expenseCats[0].id,
        userId,
      });

      // Utilities
      expensesData.push({
        title: 'Electricity & Internet',
        amount: new Prisma.Decimal(2800 + Math.floor(Math.random() * 600)),
        expenseDate: new Date(year, month, 10, 10, 30, 0),
        categoryId: expCatMap.get('Utilities') || expenseCats[5].id,
        userId,
      });

      // Groceries
      expensesData.push({
        title: 'Zepto Groceries Mart',
        amount: new Prisma.Decimal(2100 + Math.floor(Math.random() * 800)),
        expenseDate: new Date(year, month, 5, 17, 0, 0),
        categoryId: expCatMap.get('Groceries') || expenseCats[1].id,
        userId,
      });
      expensesData.push({
        title: 'Reliance Smart Groceries',
        amount: new Prisma.Decimal(3200 + Math.floor(Math.random() * 1000)),
        expenseDate: new Date(year, month, 18, 12, 0, 0),
        categoryId: expCatMap.get('Groceries') || expenseCats[1].id,
        userId,
      });

      // Food & Dining
      expensesData.push({
        title: 'Swiggy Dinner Delivery',
        amount: new Prisma.Decimal(780 + Math.floor(Math.random() * 300)),
        expenseDate: new Date(year, month, 8, 20, 0, 0),
        categoryId: expCatMap.get('Food & Dining') || expenseCats[2].id,
        userId,
      });
      expensesData.push({
        title: 'Weekend Dining Out',
        amount: new Prisma.Decimal(1500 + Math.floor(Math.random() * 800)),
        expenseDate: new Date(year, month, 22, 19, 30, 0),
        categoryId: expCatMap.get('Food & Dining') || expenseCats[2].id,
        userId,
      });

      // Shopping
      expensesData.push({
        title: 'Amazon Online Order',
        amount: new Prisma.Decimal(1200 + Math.floor(Math.random() * 3000)),
        expenseDate: new Date(year, month, 12, 15, 0, 0),
        categoryId: expCatMap.get('Shopping') || expenseCats[3].id,
        userId,
      });

      // Transport
      expensesData.push({
        title: 'Ola Cabs commute',
        amount: new Prisma.Decimal(1200 + Math.floor(Math.random() * 600)),
        expenseDate: new Date(year, month, 14, 9, 0, 0),
        categoryId: expCatMap.get('Transport') || expenseCats[4].id,
        userId,
      });

      // Entertainment
      expensesData.push({
        title: 'Netflix & Spotify subscriptions',
        amount: new Prisma.Decimal(998),
        expenseDate: new Date(year, month, 7, 8, 0, 0),
        categoryId: expCatMap.get('Entertainment') || expenseCats[7].id,
        userId,
      });

      // Healthcare
      expensesData.push({
        title: 'Pharmacy Medicines',
        amount: new Prisma.Decimal(450 + Math.floor(Math.random() * 800)),
        expenseDate: new Date(year, month, 25, 11, 0, 0),
        categoryId: expCatMap.get('Healthcare') || expenseCats[6].id,
        userId,
      });
    }

    await this.prisma.income.createMany({ data: incomesData });
    await this.prisma.expense.createMany({ data: expensesData });

    // Seed Investments
    const purchaseDate6M = new Date(now.getFullYear(), now.getMonth() - 5, 15);
    const purchaseDate3M = new Date(now.getFullYear(), now.getMonth() - 2, 10);

    await this.prisma.investment.createMany({
      data: [
        {
          name: 'Nifty 50 Index Fund',
          type: 'MUTUAL_FUND',
          amountInvested: new Prisma.Decimal(240000),
          currentValue: new Prisma.Decimal(285000),
          purchaseDate: purchaseDate6M,
          userId,
        },
        {
          name: 'Infosys Ltd',
          type: 'STOCKS',
          amountInvested: new Prisma.Decimal(98000),
          currentValue: new Prisma.Decimal(124500),
          purchaseDate: purchaseDate6M,
          userId,
        },
        {
          name: 'HDFC Fixed Deposit',
          type: 'FIXED_DEPOSIT',
          amountInvested: new Prisma.Decimal(186000),
          currentValue: new Prisma.Decimal(200000),
          purchaseDate: purchaseDate6M,
          userId,
        },
        {
          name: 'Digital Gold — Zerodha',
          type: 'GOLD',
          amountInvested: new Prisma.Decimal(80000),
          currentValue: new Prisma.Decimal(98000),
          purchaseDate: purchaseDate3M,
          userId,
        },
        {
          name: 'Bitcoin',
          type: 'CRYPTO',
          amountInvested: new Prisma.Decimal(120000),
          currentValue: new Prisma.Decimal(156000),
          purchaseDate: purchaseDate3M,
          userId,
        },
      ],
    });

    // Seed Goals
    const deadline1 = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    const deadline2 = new Date(now.getFullYear(), now.getMonth() + 12, 0);
    const deadline3 = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    await this.prisma.goal.createMany({
      data: [
        {
          name: 'Emergency Fund',
          targetAmount: new Prisma.Decimal(500000),
          currentAmount: new Prisma.Decimal(320000),
          targetDate: deadline1,
          description: JSON.stringify({ category: 'Emergency', desc: '6 months of living expenses' }),
          userId,
        },
        {
          name: 'Europe Trip 2027',
          targetAmount: new Prisma.Decimal(250000),
          currentAmount: new Prisma.Decimal(87500),
          targetDate: deadline2,
          description: JSON.stringify({ category: 'Travel', desc: 'Summer holiday in France & Italy' }),
          userId,
        },
        {
          name: 'New MacBook Pro',
          targetAmount: new Prisma.Decimal(180000),
          currentAmount: new Prisma.Decimal(144000),
          targetDate: deadline3,
          description: JSON.stringify({ category: 'Electronics', desc: 'MacBook Pro M4 16GB' }),
          userId,
        },
      ],
    });

    // Log Activity
    await this.prisma.activityLog.create({
      data: {
        action: 'Workspace Seeding Completed',
        userId,
        metadata: { timestamp: new Date().toISOString() },
      },
    });

    // Invalidate Redis caches
    await this.redisService.delPattern(`dashboard:*:${userId}`);
    await this.redisService.delPattern(`analytics:*:${userId}`);
  }
}
