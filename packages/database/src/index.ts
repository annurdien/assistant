import { PrismaClient } from './generated/prisma/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Re-export types
export * from './generated/prisma/index.js';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assistant?schema=public';
    // @ts-ignore - mismatch in community pg types across monorepo packages
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool as any);
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

// Export a default singleton
export const prisma = getPrismaClient();
