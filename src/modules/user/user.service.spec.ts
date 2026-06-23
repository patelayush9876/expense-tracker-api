import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { RedisService } from '@/providers/redis/redis.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            expense: { deleteMany: jest.fn(), createMany: jest.fn() },
            income: { deleteMany: jest.fn(), createMany: jest.fn() },
            investment: { deleteMany: jest.fn(), createMany: jest.fn() },
            goal: { deleteMany: jest.fn(), createMany: jest.fn() },
            notification: { deleteMany: jest.fn() },
            activityLog: { deleteMany: jest.fn(), create: jest.fn() },
            expenseCategory: { findMany: jest.fn(), createMany: jest.fn() },
            incomeCategory: { findMany: jest.fn(), createMany: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: RedisService,
          useValue: {
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
