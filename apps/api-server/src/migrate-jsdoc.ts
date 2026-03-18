import { prisma } from '@assistant/database';

async function main() {
  const commands = await prisma.command.findMany();
  let updated = 0;

  for (const cmd of commands) {
    if (cmd.script && !cmd.script.includes('/**') && cmd.script.includes('export default')) {
      const newScript = `/**\n * @param {SandboxContext} ctx\n */\n` + cmd.script;
      await prisma.command.update({
        where: { id: cmd.id },
        data: { script: newScript }
      });
      updated++;
    }
  }

  console.log(`Migrated \${updated} commands to include JSDoc typings.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
