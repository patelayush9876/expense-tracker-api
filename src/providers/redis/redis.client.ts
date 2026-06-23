import Redis from 'ioredis';
import { config } from '@/config';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
});

redisClient.on('connect', () => {
  console.log('Redis Connected Successfully ✔️');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Error', err);
});
