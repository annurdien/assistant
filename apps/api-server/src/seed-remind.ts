import { prisma } from '@assistant/database';

async function seed() {
  const scriptContent = `export default async function(ctx) {
  if (!ctx.input || ctx.input.trim().length === 0) {
    await ctx.reply('❌ Please specify your reminder. Example: /remind tomorrow at 9am to call John');
    return;
  }
  
  const prompt = \`Extract the precise future date and time from the following reminder request. Respond with ONLY the strictly formatted ISO-8601 datetime string, absolutely nothing else. Assume the current origin date/time/timezone is strictly \${new Date().toISOString()}. Request: "\${ctx.input}"\`;
  
  let aiDateStr;
  try {
     aiDateStr = await ctx.ai.ask(prompt);
  } catch (err) {
     await ctx.reply('❌ Failed to parse the requested time via AI engine. Try a simpler date format.');
     return;
  }
  
  const parsedDate = new Date(aiDateStr.trim());
  if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
    await ctx.reply('❌ The AI could not determine a valid future date from your request. (Got: ' + aiDateStr + ')');
    return;
  }
  
  await ctx.remind(parsedDate, ctx.input);
  await ctx.reply(\`✅ Reminder AI mapped precisely to: \${parsedDate.toLocaleString()}\`);
}`;

  await prisma.command.upsert({
    where: { name: 'remind' },
    update: { script: scriptContent, description: 'Schedules a one-off reminder via AI natural language' },
    create: { name: 'remind', script: scriptContent, description: 'Schedules a one-off reminder via AI natural language' }
  });
  console.log('Remind Natural Intelligence command seeded successfully.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
