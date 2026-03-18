import { AIService, ExpenseService } from '@assistant/services';
import { prisma as dbInstance, PrismaClient } from '@assistant/database';

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
export function createContext(input: string, replyCallback?: (msg: string) => Promise<void>): Context {
  // Normalize input
  const normalizedInput = input.trim();

  const db = dbInstance;

  // Instantiate services securely
  const ai = new AIService();
  const expense = new ExpenseService(db);

  const reply = async (msg: string) => {
    if (replyCallback) {
      await replyCallback(msg);
    } else {
      console.log("Reply:", msg);
    }
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
