import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var prisma: PrismaClient | undefined;
}

// 1. Create a connection pool using the standard pg library
const pool = new Pool({ connectionString: process.env.DATABASE_URL as string });

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to Prisma 
const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma;