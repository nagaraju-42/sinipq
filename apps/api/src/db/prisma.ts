import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL as string,
});

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma;