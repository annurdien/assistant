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
  session: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  media?: { mimetype: string; data: string }[] | undefined;
  remind: (time: number | string | Date, message: string) => Promise<void>;
  env: {
    get: (key: string) => Promise<string | undefined>;
  };
};

export interface ExecutionContextData {
  input: string;
  jid?: string | undefined;
  media?: { mimetype: string; data: string }[] | undefined;
}

/**
 * Creates the execution context for sandboxed command scripts.
 * 
 * @param payload The structured data securely passed into the worker VM
 * @returns Data securely packaged into an immutable Context object
 */
export function createContext(payload: ExecutionContextData, replyCallback?: (msg: string) => Promise<void>): Context {
  // Normalize input
  const normalizedInput = payload.input.trim();

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

  const session = {
    get: async (key: string) => {
      if (!payload.jid) return undefined;
      const rec = await db.session.findUnique({ where: { jid: payload.jid } });
      if (!rec) return undefined;
      const data = rec.data as Record<string, any>;
      return data[key];
    },
    set: async (key: string, value: any) => {
      if (!payload.jid) return;
      
      const rec = await db.session.findUnique({ where: { jid: payload.jid } });
      let currentData: Record<string, any> = rec ? (rec.data as Record<string, any>) : {};
      
      currentData[key] = value;
      
      await db.session.upsert({
        where: { jid: payload.jid },
        update: { data: currentData },
        create: { jid: payload.jid, data: currentData }
      });
    }
  };

  const remind = async (time: number | string | Date, message: string) => {
    if (!payload.jid) return;
    try {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const bodyPayload: any = { targetJid: payload.jid, text: message };
      
      if (typeof time === 'number') {
         bodyPayload.minutes = time;
      } else {
         bodyPayload.executeAt = time instanceof Date ? time.toISOString() : time;
      }

      const res = await fetch(`${baseUrl}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      if (!res.ok) console.error(`Sandbox Reminder failed: [${res.status}]`);
    } catch (err: any) {
      console.error(`Local Sandbox Reminder fetch crash: ${err.message}`);
    }
  };

  const env = {
    get: async (key: string) => {
      const secret = await db.secret.findUnique({ where: { key } });
      return secret?.value;
    }
  };

  // Build the structured context payload
  const context: Context = {
    input: normalizedInput,
    ai,
    expense,
    db,
    reply,
    session,
    media: payload.media,
    remind,
    env
  };

  // Freeze the payload to prevent destructive mutations by the executed sandbox script
  return Object.freeze(context);
}
