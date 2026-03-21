import { prisma } from '@assistant/database';
import bcrypt from 'bcryptjs';

async function main() {
  const existingAdmin = await prisma.admin.findFirst();
  
  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
    return;
  }

  const defaultPassword = process.env.ADMIN_PASSWORD;
  if (!defaultPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for initial admin setup. Set it in your .env file.');
  }
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await prisma.admin.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ Admin user seeded successfully. Username: admin');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
