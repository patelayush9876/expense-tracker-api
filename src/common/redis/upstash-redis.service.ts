import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { config } from '@/config';

@Injectable()
export class UpstashRedisService {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });
  }

  async get(key: string): Promise<string | null> {
    const data = await this.client.get<any>(key);
    if (data === null || data === undefined) {
      return null;
    }
    if (typeof data === 'object') {
      return JSON.stringify(data);
    }
    return String(data);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.set(key, value, { ex: expirySeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.client.del(...keys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.client.exists(...keys);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
