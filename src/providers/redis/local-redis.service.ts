import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { redisClient } from './redis.client';

/**
 * LocalRedisService
 * 
 * RESERVED FOR FUTURE LOCAL DEPLOYMENTS.
 * This service is currently unused as the active provider is UpstashRedisService.
 * It is preserved to maintain backward compatibility with local Docker-based Redis setup.
 */
@Injectable()
export class LocalRedisService implements OnModuleDestroy {
  private readonly client = redisClient;

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.set(key, value, 'EX', expirySeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async onModuleDestroy() {
    // Only quit if the client has actually connected or initiated connection
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
