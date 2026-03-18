/**
 * Migration + seed for Knowledge Base tables (Document, DocumentEmbedding)
 * Run: DATABASE_URL="..." pnpm --filter @assistant/api-server exec tsx src/migrate-kb.ts
 */
import pg from 'pg';
import { randomUUID } from 'crypto';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/admin?schema=public';
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Creating vector extension and KB tables...');

    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "filename"  TEXT NOT NULL,
        "content"   TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "DocumentEmbedding" (
        "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
        "content"    TEXT NOT NULL,
        "embedding"  vector(768),
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tables created / confirmed.');

    // Seed KB documents
    console.log('\nSeeding knowledge base documents...');
    
    // Clear existing
    await client.query(`DELETE FROM "DocumentEmbedding";`);
    await client.query(`DELETE FROM "Document";`);

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

The bot runs on a secure sandboxed Node.js environment and connects to a PostgreSQL database for persistent storage. All commands are executed inside a sandboxed V8 context with strict memory limits.`,
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
Monthly reports are generated automatically every 1st of the month.
Data is retained for 90 days by default.`,
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
      {
        filename: 'system-architecture.txt',
        content: `Assistant System Architecture

The system is a monorepo with the following packages:
- apps/api-server: Fastify REST API with JWT auth
- apps/whatsapp-service: Baileys WA client integration
- apps/dashboard: React admin panel (Vite + Shadcn UI)
- apps/worker: Isolated VM worker pool for sandbox execution
- packages/database: Prisma + pgvector PG adapter
- packages/core: Message parsing, command resolution
- packages/services: AI (Gemini), logging, rate limiting
- packages/sdk: Sandbox context type definitions

All data flows through PostgreSQL with pgvector support for semantic search.`,
      },
    ];



    for (const doc of kbDocs) {
      const docId = randomUUID();
      await client.query(
        `INSERT INTO "Document" ("id", "filename", "content", "createdAt") VALUES ($1, $2, $3, NOW())`,
        [docId, doc.filename, doc.content]
      );
      const embId = randomUUID();
      await client.query(
        `INSERT INTO "DocumentEmbedding" ("id", "documentId", "content", "createdAt")
         VALUES ($1, $2, $3, NOW())`,
        [embId, docId, doc.content.slice(0, 500)]
      );
      console.log(`  📄 Inserted: ${doc.filename}`);
    }

    console.log(`\n🎉 Knowledge base seeded with ${kbDocs.length} documents!`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
