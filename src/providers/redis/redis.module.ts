import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { UpstashRedisService } from '@/common/redis/upstash-redis.service';
import { LocalRedisService } from './local-redis.service';

@Global()
@Module({
  providers: [RedisService, UpstashRedisService, LocalRedisService],
  exports: [RedisService, UpstashRedisService, LocalRedisService],
})
export class RedisModule {}
