import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number; // Maximum requests allowed
  ttl: number; // Time window in seconds
}

export const RATE_LIMIT_KEY = 'rate_limit_options';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
