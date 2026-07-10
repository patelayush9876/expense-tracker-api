import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        settings: {
          create: {},
        },
        expenseCategories: {
          createMany: {
            data: [
              { name: 'Housing' },
              { name: 'Groceries' },
              { name: 'Food & Dining' },
              { name: 'Shopping' },
              { name: 'Transport' },
              { name: 'Utilities' },
              { name: 'Healthcare' },
              { name: 'Entertainment' },
              { name: 'Others' },
            ],
          },
        },
        incomeCategories: {
          createMany: {
            data: [
              { name: 'Salary' },
              { name: 'Freelance' },
              { name: 'Investments' },
              { name: 'Side Business' },
            ],
          },
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { settings: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { settings: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: { settings: true },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { settings: true },
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findSettings(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      include: {
        settings: true,
        _count: {
          select: {
            expenses: true,
            incomes: true,
            investments: true,
            goals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRole(id: string, role: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      include: { settings: true },
    });
  }
}
