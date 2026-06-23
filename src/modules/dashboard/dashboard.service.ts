import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { RedisService } from '@/providers/redis/redis.service';

@Injectable()
export class DashboardService {
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

  async getSummary(userId: string) {
    return this.getOrSetCache(`dashboard:summary:${userId}`, async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const [
        incomeSum,
        expenseSum,
        monthlyIncomeSum,
        monthlyExpenseSum,
        investmentSum,
      ] = await Promise.all([
        this.prisma.income.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        this.prisma.income.aggregate({
          where: { userId, incomeDate: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            userId,
            expenseDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.investment.aggregate({
          where: { userId },
          _sum: { currentValue: true },
        }),
      ]);

      const totalBalance =
        Number(incomeSum._sum.amount || 0) -
        Number(expenseSum._sum.amount || 0);
      const monthlyIncome = Number(monthlyIncomeSum._sum.amount || 0);
      const monthlyExpense = Number(monthlyExpenseSum._sum.amount || 0);
      const totalInvestments = Number(investmentSum._sum.currentValue || 0);
      const netWorth = totalBalance + totalInvestments;
      const savingsRate =
        monthlyIncome > 0
          ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
          : 0;

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        totalInvestments,
        netWorth,
        savingsRate,
      };
    });
  }

  async getMonthlyIncomeExpense(userId: string) {
    return this.getOrSetCache(
      `dashboard:monthly-income-expense:${userId}`,
      async () => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [incomes, expenses] = await Promise.all([
          this.prisma.income.findMany({
            where: { userId, incomeDate: { gte: sixMonthsAgo } },
            select: { amount: true, incomeDate: true },
          }),
          this.prisma.expense.findMany({
            where: { userId, expenseDate: { gte: sixMonthsAgo } },
            select: { amount: true, expenseDate: true },
          }),
        ]);

        const monthsMap: {
          [key: string]: { income: number; expense: number };
        } = {};

        // Populate last 6 months in order
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          monthsMap[key] = { income: 0, expense: 0 };
        }

        incomes.forEach((inc) => {
          const d = new Date(inc.incomeDate);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthsMap[key]) {
            monthsMap[key].income += Number(inc.amount);
          }
        });

        expenses.forEach((exp) => {
          const d = new Date(exp.expenseDate);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthsMap[key]) {
            monthsMap[key].expense += Number(exp.amount);
          }
        });

        return Object.keys(monthsMap).map((month) => ({
          month,
          income: monthsMap[month].income,
          expense: monthsMap[month].expense,
        }));
      },
    );
  }

  async getCategoryBreakdown(userId: string) {
    return this.getOrSetCache(
      `dashboard:category-breakdown:${userId}`,
      async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const expenses = await this.prisma.expense.findMany({
          where: { userId, expenseDate: { gte: startOfMonth } },
          include: { category: true },
        });

        const categoryMap: { [key: string]: number } = {};
        let totalExpense = 0;

        expenses.forEach((exp) => {
          const amt = Number(exp.amount);
          categoryMap[exp.category.name] =
            (categoryMap[exp.category.name] || 0) + amt;
          totalExpense += amt;
        });

        return Object.keys(categoryMap).map((name) => {
          const amount = categoryMap[name];
          return {
            category: name,
            amount,
            percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          };
        });
      },
    );
  }

  async getCashFlow(userId: string) {
    return this.getOrSetCache(`dashboard:cash-flow:${userId}`, async () => {
      const now = new Date();
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1,
      );

      const [incomes, expenses] = await Promise.all([
        this.prisma.income.findMany({
          where: { userId, incomeDate: { gte: twelveMonthsAgo } },
          select: { amount: true, incomeDate: true },
        }),
        this.prisma.expense.findMany({
          where: { userId, expenseDate: { gte: twelveMonthsAgo } },
          select: { amount: true, expenseDate: true },
        }),
      ]);

      const monthsMap: { [key: string]: { income: number; expense: number } } =
        {};

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        monthsMap[key] = { income: 0, expense: 0 };
      }

      incomes.forEach((inc) => {
        const d = new Date(inc.incomeDate);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthsMap[key]) {
          monthsMap[key].income += Number(inc.amount);
        }
      });

      expenses.forEach((exp) => {
        const d = new Date(exp.expenseDate);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthsMap[key]) {
          monthsMap[key].expense += Number(exp.amount);
        }
      });

      return Object.keys(monthsMap).map((month) => {
        const income = monthsMap[month].income;
        const expense = monthsMap[month].expense;
        return {
          month,
          income,
          expense,
          netCashFlow: income - expense,
        };
      });
    });
  }

  async getInvestmentAllocation(userId: string) {
    return this.getOrSetCache(
      `dashboard:investment-allocation:${userId}`,
      async () => {
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
      },
    );
  }

  async getNetWorthHistory(userId: string) {
    return this.getOrSetCache(
      `dashboard:net-worth-history:${userId}`,
      async () => {
        const now = new Date();
        const months: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          months.push(
            new Date(
              now.getFullYear(),
              now.getMonth() - i + 1,
              0,
              23,
              59,
              59,
              999,
            ),
          );
        }

        const history: any[] = [];

        for (const endOfMonth of months) {
          const [incomeSum, expenseSum, investmentSum] = await Promise.all([
            this.prisma.income.aggregate({
              where: { userId, incomeDate: { lte: endOfMonth } },
              _sum: { amount: true },
            }),
            this.prisma.expense.aggregate({
              where: { userId, expenseDate: { lte: endOfMonth } },
              _sum: { amount: true },
            }),
            this.prisma.investment.aggregate({
              // Assumes investments currentValue represents total asset value up to that month
              where: { userId, purchaseDate: { lte: endOfMonth } },
              _sum: { currentValue: true },
            }),
          ]);

          const balance =
            Number(incomeSum._sum.amount || 0) -
            Number(expenseSum._sum.amount || 0);
          const investments = Number(investmentSum._sum.currentValue || 0);
          const netWorth = balance + investments;

          const monthStr = `${endOfMonth.getFullYear()}-${(endOfMonth.getMonth() + 1).toString().padStart(2, '0')}`;
          history.push({
            month: monthStr,
            balance,
            investments,
            netWorth,
          });
        }

        return history;
      },
    );
  }
}
