import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { RedisService } from '@/providers/redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private async getOrSetCache<T>(
    key: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redisService.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const data = await callback();
    await this.redisService.set(key, JSON.stringify(data), 3600); // 1 hour TTL
    return data;
  }

  async getSpendingTrends(userId: string) {
    return this.getOrSetCache(
      `analytics:spending-trends:${userId}`,
      async () => {
        const now = new Date();
        const currentMonthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        const prevMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const prevMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );

        const [currentExpenses, prevExpenses] = await Promise.all([
          this.prisma.expense.aggregate({
            where: { userId, expenseDate: { gte: currentMonthStart } },
            _sum: { amount: true },
          }),
          this.prisma.expense.aggregate({
            where: {
              userId,
              expenseDate: { gte: prevMonthStart, lte: prevMonthEnd },
            },
            _sum: { amount: true },
          }),
        ]);

        const currentTotal = Number(currentExpenses._sum.amount || 0);
        const prevTotal = Number(prevExpenses._sum.amount || 0);

        const difference = currentTotal - prevTotal;
        const percentageChange =
          prevTotal > 0 ? (difference / prevTotal) * 100 : 0;

        return {
          currentMonthTotal: currentTotal,
          previousMonthTotal: prevTotal,
          difference,
          percentageChange,
        };
      },
    );
  }

  async getIncomeTrends(userId: string) {
    return this.getOrSetCache(`analytics:income-trends:${userId}`, async () => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      const [currentIncomes, prevIncomes] = await Promise.all([
        this.prisma.income.aggregate({
          where: { userId, incomeDate: { gte: currentMonthStart } },
          _sum: { amount: true },
        }),
        this.prisma.income.aggregate({
          where: {
            userId,
            incomeDate: { gte: prevMonthStart, lte: prevMonthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const currentTotal = Number(currentIncomes._sum.amount || 0);
      const prevTotal = Number(prevIncomes._sum.amount || 0);

      const difference = currentTotal - prevTotal;
      const percentageChange =
        prevTotal > 0 ? (difference / prevTotal) * 100 : 0;

      return {
        currentMonthTotal: currentTotal,
        previousMonthTotal: prevTotal,
        difference,
        percentageChange,
      };
    });
  }

  async getTopCategories(userId: string) {
    return this.getOrSetCache(
      `analytics:top-categories:${userId}`,
      async () => {
        const now = new Date();
        const currentMonthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );

        const expenses = await this.prisma.expense.findMany({
          where: { userId, expenseDate: { gte: currentMonthStart } },
          include: { category: true },
        });

        const categoryMap: { [key: string]: number } = {};
        expenses.forEach((exp) => {
          const amt = Number(exp.amount);
          categoryMap[exp.category.name] =
            (categoryMap[exp.category.name] || 0) + amt;
        });

        return Object.keys(categoryMap)
          .map((name) => ({
            category: name,
            amount: categoryMap[name],
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
      },
    );
  }

  async getSavingsAnalysis(userId: string) {
    return this.getOrSetCache(
      `analytics:savings-analysis:${userId}`,
      async () => {
        const now = new Date();
        const history: any[] = [];

        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(
            now.getFullYear(),
            now.getMonth() - i + 1,
            0,
            23,
            59,
            59,
            999,
          );

          const [incomeSum, expenseSum] = await Promise.all([
            this.prisma.income.aggregate({
              where: { userId, incomeDate: { gte: start, lte: end } },
              _sum: { amount: true },
            }),
            this.prisma.expense.aggregate({
              where: { userId, expenseDate: { gte: start, lte: end } },
              _sum: { amount: true },
            }),
          ]);

          const income = Number(incomeSum._sum.amount || 0);
          const expense = Number(expenseSum._sum.amount || 0);
          const savings = Math.max(0, income - expense);
          const savingsRate = income > 0 ? (savings / income) * 100 : 0;

          const monthStr = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}`;
          history.push({
            month: monthStr,
            income,
            expense,
            savings,
            savingsRate,
          });
        }

        return history;
      },
    );
  }

  async getInvestmentPerformance(userId: string) {
    return this.getOrSetCache(
      `analytics:investment-performance:${userId}`,
      async () => {
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
        const totalReturnPercentage =
          totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        return {
          totalInvested,
          totalCurrentValue,
          totalProfitLoss,
          totalReturnPercentage,
          investmentCount: investments.length,
        };
      },
    );
  }
}
