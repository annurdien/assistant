import { PrismaClient } from './generated/prisma/client.js';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/admin?schema=public';
const pool = new pg.Pool({ connectionString });
// @ts-ignore - ignore pool version collision
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing commands...');
  await prisma.command.deleteMany({});

  console.log('Seeding /hello command...');
  await prisma.command.create({
    data: {
      name: 'hello',
      description: 'Simple greeting to test system pipeline.',
      enabled: true,
      script: `export default async function(ctx) {
  return "👋 Hello there! The system is fully operational.";
}`
    }
  });

  console.log('Seeding /ai command...');
  await prisma.command.create({
    data: {
      name: 'ai',
      description: 'Interact with OpenAI inference.',
      enabled: true,
      script: `export default async function(ctx) {
  if (!ctx.input) return "Please provide a prompt. Example: /ai What is the capital of France?";
  
  try {
    const response = await ctx.ai.ask(ctx.input);
    return "🤖 AI: " + response;
  } catch (err) {
    return "⚠️ AI Error: " + err.message;
  }
}`
    }
  });

  console.log('Seeding /expense command...');
  await prisma.command.create({
    data: {
      name: 'expense',
      description: 'Manage simple expenses in the database.',
      enabled: true,
      script: `export default async function(ctx) {
  const parts = ctx.input.trim().split(' ');
  const action = parts[0]?.toLowerCase();

  if (action === 'add') {
    const amount = parseFloat(parts[1]);
    const note = parts.slice(2).join(' ');
    
    if (isNaN(amount) || !note) {
      return "Format: /expense add <amount> <note>";
    }
    
    await ctx.expense.add(amount, note);
    return \`✅ Added expense: $\${amount} for "\${note}"\`;
  }
  
  if (action === 'list' || action === 'summarize') {
    const total = await ctx.expense.summarize();
    return \`📊 Total Expenses: $\${total}\`;
  }

  return "Commands: /expense add <amount> <note> | /expense summarize";
}`
    }
  });

  console.log('✅ Commands seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
