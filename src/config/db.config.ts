import { getEnv } from './env';

export const dbConfig = {
    url: getEnv('DATABASE_URL'),
};