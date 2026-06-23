import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '@/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(private readonly logger: PinoLogger) {
    const pool = new Pool({
      connectionString: config.db.url,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();

    this.logger.info('PostgreSQL Connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();

    this.logger.info('PostgreSQL Disconnected');
  }
}
