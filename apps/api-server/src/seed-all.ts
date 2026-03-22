/**
 * Comprehensive seed script for all dashboard-visible data.
 * Run with: pnpm --filter @assistant/api-server exec tsx src/seed-all.ts
 */
import { prisma } from '@assistant/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ─── 1. Admin user ───────────────────────────────────────────────────────────
  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required but not set. Cannot seed admin user.');
    }
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.admin.create({ data: { username: 'admin', passwordHash: hash } });
    console.log('✅ Admin user created with secure password from ADMIN_PASSWORD env var');
  } else {
    // If password changed in env, re-hash and update
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const isMatch = await bcrypt.compare(adminPassword, existingAdmin.passwordHash);
      if (!isMatch) {
        const hash = await bcrypt.hash(adminPassword, 12);
        await prisma.admin.update({ where: { id: existingAdmin.id }, data: { passwordHash: hash } });
        console.log('🔄 Admin password updated from ADMIN_PASSWORD env var');
      } else {
        console.log('⏩ Admin user already exists with correct password, skipping');
      }
    } else {
      console.log('⏩ Admin user already exists, skipping');
    }
  }

  // ─── 2. Execution Logs ──────────────────────────────────────────────────────
  console.log('\n📋 Seeding execution logs...');
  await prisma.log.deleteMany({});

  const logEntries = [
    { commandName: 'hello', status: 'success', output: '👋 Hello there! The system is fully operational.', hoursAgo: 0.2 },
    { commandName: 'ai', status: 'success', output: '🤖 AI: The capital of France is Paris.', hoursAgo: 0.5 },
    { commandName: 'expense', status: 'success', output: '✅ Added expense: $25.50 for "Coffee & snacks"', hoursAgo: 1 },
    { commandName: 'remind', status: 'success', output: '⏰ Reminder set for 2026-03-19 08:00:00', hoursAgo: 1.5 },
    { commandName: 'ai', status: 'error', output: '⚠️ AI Error: Rate limit exceeded. Please try again.', hoursAgo: 2 },
    { commandName: 'expense', status: 'success', output: '📊 Total Expenses: $142.75', hoursAgo: 3 },
    { commandName: 'hello', status: 'success', output: '👋 Hello there! The system is fully operational.', hoursAgo: 4 },
    { commandName: 'rek', status: 'success', output: '🏦 Rekening: BCA 1234567890 a/n John Doe', hoursAgo: 5 },
    { commandName: 'ai', status: 'success', output: '🤖 AI: Machine learning is a subset of artificial intelligence...', hoursAgo: 6 },
    { commandName: 'help', status: 'success', output: '📌 Available commands: /hello, /ai, /expense, /remind, /rek, /help', hoursAgo: 8 },
    { commandName: 'expense', status: 'error', output: 'Format: /expense add <amount> <note>', hoursAgo: 10 },
    { commandName: 'remind', status: 'success', output: '⏰ Reminder set for 2026-03-20 09:00:00', hoursAgo: 12 },
    { commandName: 'ai', status: 'success', output: '🤖 AI: There are approximately 8.7 million species on Earth.', hoursAgo: 16 },
    { commandName: 'hello', status: 'success', output: '👋 Hello there! The system is fully operational.', hoursAgo: 20 },
    { commandName: 'expense', status: 'success', output: '✅ Added expense: $89.99 for "Monthly subscription"', hoursAgo: 24 },
    { commandName: 'help', status: 'success', output: '📌 Available commands: /hello, /ai, /expense, /remind', hoursAgo: 28 },
    { commandName: 'ai', status: 'success', output: '🤖 AI: Python was created by Guido van Rossum in 1991.', hoursAgo: 32 },
    { commandName: 'rek', status: 'success', output: '🏦 Account info retrieved successfully.', hoursAgo: 36 },
    { commandName: 'remind', status: 'error', output: 'Failed to parse date. Please use: /remind <message> at <time>', hoursAgo: 40 },
    { commandName: 'expense', status: 'success', output: '📊 Total Expenses: $232.74', hoursAgo: 48 },
  ];

  for (const entry of logEntries) {
    const createdAt = new Date(Date.now() - entry.hoursAgo * 3600 * 1000);
    await prisma.log.create({
      data: {
        commandName: entry.commandName,
        status: entry.status,
        output: entry.output,
        createdAt,
      }
    });
  }
  console.log(`✅ Seeded ${logEntries.length} log entries`);

  // ─── 3. Secrets ─────────────────────────────────────────────────────────────
  console.log('\n🔐 Seeding secrets...');
  await prisma.secret.deleteMany({});
  const secrets = [
    { key: 'GEMINI_API_KEY', value: 'AIzaSy_demo_key_replace_with_real_one_xyz' },
    { key: 'OPENWEATHER_API_KEY', value: 'abc123def456ghi789jkl012mno345pq' },
    { key: 'STRIPE_SECRET_KEY', value: 'sk_test_51NxQxZ_demo_stripe_key_abc123' },
    { key: 'TELEGRAM_BOT_TOKEN', value: '7123456789:AAHdemo_telegram_token_xyz123' },
    { key: 'NOTION_API_TOKEN', value: 'secret_demo_notion_token_abc123xyz456' },
  ];
  for (const s of secrets) {
    await prisma.secret.create({ data: s });
  }
  console.log(`✅ Seeded ${secrets.length} secrets`);

  // ─── 4. Settings ─────────────────────────────────────────────────────────────
  // IMPORTANT: Use createMany with skipDuplicates so we NEVER overwrite user-configured values.
  // upsert() would reset the AI key, command prefix, etc. on every container restart.
  console.log('\n⚙️  Seeding settings (defaults only — existing values are preserved)...');
  const settingEntries = [
    { key: 'AI_PROVIDER', value: 'gemini' },
    { key: 'AI_MODEL', value: 'gemini-2.0-flash' },
    { key: 'AI_API_KEY', value: '' },          // blank default — user must set via Settings page
    { key: 'WA_COMMAND_PREFIX', value: '/' },
    { key: 'WA_ALLOWED_NUMBERS', value: '' },
    { key: 'WA_REPLY_UNKNOWN', value: 'false' },
    { key: 'WA_MAINTENANCE_MODE', value: 'false' },
  ];
  const { count } = await prisma.setting.createMany({
    data: settingEntries,
    skipDuplicates: true,   // keeps any value the user already changed in the UI
  });
  console.log(`✅ Seeded ${count} new settings (${settingEntries.length - count} already existed, kept as-is)`);

  // ─── 5. CronJobs ────────────────────────────────────────────────────────────
  console.log('\n⏰ Seeding cron jobs...');
  await prisma.cronJob.deleteMany({});
  
  // Get commands to reference
  const commands = await prisma.command.findMany({ take: 3 });
  if (commands.length > 0) {
    const cmd0Id = commands[0]!.id;
    const cmd1Id = commands[commands.length > 1 ? 1 : 0]!.id;
    const cronJobs = [
      { commandId: cmd0Id, schedule: '0 8 * * *', targetJid: '6281234567890@s.whatsapp.net', enabled: true },
      { commandId: cmd0Id, schedule: '0 20 * * *', targetJid: '6281234567890@s.whatsapp.net', enabled: true },
      { commandId: cmd1Id, schedule: '0 9 * * 1', targetJid: '6289876543210@s.whatsapp.net', enabled: false },
    ];
    for (const job of cronJobs) {
      await prisma.cronJob.create({ data: job });
    }
    console.log(`✅ Seeded ${cronJobs.length} cron jobs`);
  } else {
    console.log('⚠️  No commands found — skipping cron jobs');
  }

  // ─── 6. User Quotas (Analytics page) ────────────────────────────────────────
  console.log('\n📊 Seeding user quotas for analytics...');
  await prisma.userQuota.deleteMany({});
  const quotas = [
    { jid: '6281111111111@s.whatsapp.net', commandCount: 47, tokensUsed: 12830 },
    { jid: '6282222222222@s.whatsapp.net', commandCount: 31, tokensUsed: 9210 },
    { jid: '6283333333333@s.whatsapp.net', commandCount: 28, tokensUsed: 7645 },
    { jid: '6284444444444@s.whatsapp.net', commandCount: 19, tokensUsed: 5120 },
    { jid: '6285555555555@s.whatsapp.net', commandCount: 14, tokensUsed: 3890 },
    { jid: '6286666666666@s.whatsapp.net', commandCount: 9, tokensUsed: 2100 },
  ];
  const resetAt = new Date(Date.now() + 24 * 3600 * 1000);
  for (const q of quotas) {
    await prisma.userQuota.create({ data: { ...q, resetAt } });
  }
  console.log(`✅ Seeded ${quotas.length} user quota entries`);

  // ─── 7. Knowledge Base Documents (raw SQL) ─────────────────────────────────
  console.log('\n🧠 Seeding knowledge base documents...');
  
  // Check if Document table exists and clear it
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "DocumentEmbedding"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Document"`);
    
    const kbDocs = [
      {
        filename: 'whatsapp-bot-guide.txt',
        content: `WhatsApp Assistant Bot User Guide

This bot supports the following commands:
- /hello — Simple greeting to test the system
- /ai <prompt> — Ask the AI assistant anything
- /expense add <amount> <note> — Track an expense
- /expense summarize — View total expenses
- /remind <message> at <time> — Set a reminder
- /help — Show available commands

The bot runs on a secure sandboxed Node.js environment and connects to a PostgreSQL database for persistent storage.`,
      },
      {
        filename: 'expense-tracking-sop.txt',
        content: `Standard Operating Procedure: Expense Tracking

1. Add an expense: /expense add 50000 "Lunch meeting"
2. The amount should be in your local currency
3. Notes are optional but recommended for clarity
4. View totals: /expense summarize
5. All expenses are stored securely per user session

Categories: Food, Transport, Utilities, Entertainment, Health, Other.
Monthly reports are generated automatically every 1st of the month.`,
      },
      {
        filename: 'ai-prompting-tips.txt',
        content: `Tips for Getting Better AI Responses

1. Be specific in your question — "What is the boiling point of water at 1 atm?" is better than "water question"
2. Provide context when needed — "As a marketing manager, how do I..."
3. Ask for formats — "Explain in 3 bullet points"
4. For code generation — "Write a Python function that sorts a list by second element"
5. Chain requests — The AI remembers context within a session

The AI uses Google Gemini 2.0 Flash model for fast, accurate responses. Token limits apply per day.`,
      },
    ];
    
    for (const doc of kbDocs) {
      const docResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
        INSERT INTO "Document" ("id", "filename", "content", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, NOW())
        RETURNING "id"
      `, doc.filename, doc.content);
      
      const docId = docResult[0]?.id;
      if (docId) {
        // Insert a fake embedding (768 zeros — won't be searchable but satisfies the schema)
        const fakeVector = `[${Array(768).fill('0.001').join(',')}]`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO "DocumentEmbedding" ("id", "documentId", "content", "embedding", "createdAt")
          VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())
        `, docId, doc.content.slice(0, 500), fakeVector);
        console.log(`  📄 Seeded document: ${doc.filename}`);
      }
    }
    console.log(`✅ Seeded ${kbDocs.length} knowledge base documents`);
  } catch (err: any) {
    console.warn(`⚠️  KB seed failed (table may not exist yet): ${err.message}`);
  }

  console.log('\n🎉 All seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
