import { PrismaClient } from './generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/admin?schema=public';
const pool = new pg.Pool({ connectionString });
// @ts-ignore
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const scriptPath = path.resolve(__dirname, '../../../docs/expense-command.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');

  const result = await prisma.command.updateMany({
    where: { name: { in: ['expense', 'exp'] } },
    data: { script: scriptContent }
  });
  console.log(`✅ Updated ${result.count} expense commands with new List feature.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
