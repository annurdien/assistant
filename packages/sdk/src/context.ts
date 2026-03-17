import { AIService, ExpenseService } from '@assistant/services';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../apps/api-server/src/generated/prisma/client.js';

// Singleton Prisma instance to avoid exhausting database connections
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assistant?schema=public';
    // @ts-ignore - mismatch in community pg types across monorepo packages
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool as any);
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

/**
 * The Context object injected into user scripts.
 * It provides strict, controlled access to modular services.
 */
export type Context = {
  input: string;
  ai: AIService;
  expense: ExpenseService;
  db: PrismaClient;
  reply: (msg: string) => Promise<void>;
};

/**
 * Creates the execution context for sandboxed command scripts.
 * 
 * @param input The raw input string provided by the user
 * @returns Data securely packaged into an immutable Context object
 */
export function createContext(input: string): Context {
  // Normalize input
  const normalizedInput = input.trim();

  // Obtain singleton Prisma client
  const db = getPrismaClient();

  // Instantiate services securely
  const ai = new AIService();
  const expense = new ExpenseService(db);

  // Placeholder function for WhatsApp reply integration
  const reply = async (msg: string) => {
    console.log("Reply:", msg);
  };

  // Build the structured context payload
  const context: Context = {
    input: normalizedInput,
    ai,
    expense,
    db,
    reply,
  };

  // Freeze the payload to prevent destructive mutations by the executed sandbox script
  return Object.freeze(context);
}
