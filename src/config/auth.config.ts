import { getEnv } from './env';

export const authConfig = {
    jwtSecret: getEnv('JWT_ACCESS_SECRET'),

    jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),

    accessTokenExpiry: getEnv('ACCESS_TOKEN_EXPIRY'),

    refreshTokenExpiry: getEnv('REFRESH_TOKEN_EXPIRY'),
};