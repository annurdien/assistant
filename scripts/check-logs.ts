import { PrismaClient } from '@assistant/database';
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(logs, null, 2));
}
main().finally(() => prisma.$disconnect());
