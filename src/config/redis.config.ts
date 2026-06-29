import { getEnv } from './env';

export const redisConfig = {
  url: getEnv('UPSTASH_REDIS_REST_URL'),
  token: getEnv('UPSTASH_REDIS_REST_TOKEN'),

  // Reserved for local development (optional, no validation)
  host: process.env.REDIS_HOST ?? 'localhost',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
};
