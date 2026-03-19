import { prisma } from '@assistant/database';
import fs from 'fs';

async function main() {
  const scriptContent = fs.readFileSync('docs/expense-command.js', 'utf8');
  
  const cmd = await prisma.command.findUnique({ where: { name: 'expense' } });
  
  if (cmd) {
    await prisma.command.update({
      where: { name: 'expense' },
      data: { script: scriptContent }
    });
    console.log('✅ Updated expense command script in DB');
  } else {
    console.log('⚠️ Command "expense" not found in DB');
  }

  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log('\nRecent Logs:', JSON.stringify(logs, null, 2));
}

main().finally(() => prisma.$disconnect());
