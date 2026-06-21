import { getEnv } from './env';

export const corsConfig = {
  origin: getEnv('CLIENT_URL'),
  credentials: true,
};