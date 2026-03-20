import { PrismaClient } from './generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/admin?schema=public';
const pool = new pg.Pool({ connectionString });
// @ts-ignore
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.command.updateMany({
    where: { name: { in: ['ai', 'expense', 'remind', 'help', 'hello'] } },
    data: { isBuiltIn: true }
  });
  console.log(`✅ Updated ${result.count} core commands to be built-in`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
