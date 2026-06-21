import { getEnv } from './env';

export const redisConfig = {
  host: getEnv('REDIS_HOST'),

  port: Number(getEnv('REDIS_PORT')),

  db: Number(getEnv('REDIS_DB')),
};