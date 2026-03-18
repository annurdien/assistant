import { prisma } from '@assistant/database';

async function seed() {
  const scriptContent = `export default async function(ctx) {
  const commands = await ctx.db.command.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' }
  });

  if (commands.length === 0) {
    await ctx.reply("❌ No commands are currently available.");
    return;
  }

  let helpText = "🤖 *Available Commands*\\n\\n";
  for (const cmd of commands) {
    const desc = cmd.description ? \` - \${cmd.description}\` : '';
    helpText += \`*/\${cmd.name}*\${desc}\\n\`;
  }
  
  helpText += \`\\nType /<command> to interact with the assistant!\`;
  
  await ctx.reply(helpText.trim());
}`;

  await prisma.command.upsert({
    where: { name: 'help' },
    update: { script: scriptContent, description: 'Displays all available bot commands and functionality' },
    create: { name: 'help', script: scriptContent, description: 'Displays all available bot commands and functionality' }
  });
  console.log('Help command seeded securely!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
