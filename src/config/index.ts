import 'dotenv/config';
import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { corsConfig } from './cors.config';
import { dbConfig } from './db.config';
import { loggerConfig } from './logger.config';
import { redisConfig } from './redis.config';

export const config = {
  app: appConfig,
  auth: authConfig,
  db: dbConfig,
  cors: corsConfig,
  redis: redisConfig,
  logger: loggerConfig,
} as const;
