import { getEnv } from './env';

export const appConfig = {
  port: Number(getEnv('PORT')),
  environment: String(getEnv('NODE_ENV')),
};
