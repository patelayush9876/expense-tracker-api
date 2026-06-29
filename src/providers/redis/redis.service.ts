import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { UpstashRedisService } from '@/common/redis/upstash-redis.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(private readonly upstashRedisService: UpstashRedisService) {}

  async get(key: string): Promise<string | null> {
    return this.upstashRedisService.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    await this.upstashRedisService.set(key, value, expirySeconds);
  }

  async del(key: string): Promise<void> {
    await this.upstashRedisService.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    await this.upstashRedisService.delPattern(pattern);
  }

  async incr(key: string): Promise<number> {
    return this.upstashRedisService.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.upstashRedisService.expire(key, seconds);
  }

  async exists(key: string): Promise<number> {
    return this.upstashRedisService.exists(key);
  }

  async ttl(key: string): Promise<number> {
    return this.upstashRedisService.ttl(key);
  }

  async decr(key: string): Promise<number> {
    return this.upstashRedisService.decr(key);
  }

  async onModuleDestroy() {
    // Upstash Redis uses REST API and is stateless; no connection to close.
  }
}
