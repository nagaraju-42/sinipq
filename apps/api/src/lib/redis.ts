import { Redis } from 'ioredis';

if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error('UPSTASH_REDIS_URL is missing in your .env file');
}

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);