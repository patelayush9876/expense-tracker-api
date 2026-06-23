import { getEnv } from './env';

export const loggerConfig = {
  level: getEnv(
    'LOG_LEVEL',
    getEnv('NODE_ENV', 'development') === 'production' ? 'info' : 'debug',
  ),
};
