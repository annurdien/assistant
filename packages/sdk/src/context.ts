import { AIService, ExpenseService } from '@assistant/services';
import { prisma as dbInstance } from '@assistant/database';

/**
 * The Context object injected into user scripts.
 * Provides controlled, minimal access to services.
 *
 * Security notes:
 *  - `ctx.db` has been REMOVED to prevent scripts from accessing the full
 *    Prisma client (admin, secret, setting tables etc.)
 *  - `ctx.env.get()` has been REMOVED to prevent secret exfiltration.
 *    Use the ExpenseService or AIService for higher-level operations.
 */
export type Context = {
  input: string;
  ai: AIService;
  expense: ExpenseService;
  reply: (msg: string) => Promise<void>;
  session: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  setting: {
    get: (key: string) => Promise<string | undefined>;
  };
  media?: { mimetype: string; data: string }[] | undefined;
  remind: (time: number | string | Date, message: string) => Promise<void>;
};

export interface ExecutionContextData {
  input: string;
  jid?: string | undefined;
  media?: { mimetype: string; data: string }[] | undefined;
}

/**
 * Creates the execution context for sandboxed command scripts.
 */
export function createContext(payload: ExecutionContextData, replyCallback?: (msg: string) => Promise<void>): Context {
  const normalizedInput = payload.input.trim();

  const db = dbInstance;

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
      // HIGH-1: Validate key format and cap value size to prevent DB bloat / prototype pollution
      if (!/^[a-zA-Z0-9_\-]{1,100}$/.test(key)) {
        throw new Error('Invalid session key: only alphanumeric, underscore, and dash allowed (max 100 chars)');
      }
      const serialized = JSON.stringify(value);
      if (serialized.length > 8192) {
        throw new Error('Session value too large: maximum 8 KB allowed');
      }
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

  const setting = {
    get: async (key: string) => {
      const rec = await db.setting.findUnique({ where: { key } });
      return rec?.value;
    }
  };

  const remind = async (time: number | string | Date, message: string) => {
    if (!payload.jid) return;
    try {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const internalToken = process.env.INTERNAL_API_TOKEN || '';
      const bodyPayload: any = { targetJid: payload.jid, text: message };

      if (typeof time === 'number') {
        bodyPayload.minutes = time;
      } else {
        bodyPayload.executeAt = time instanceof Date ? time.toISOString() : time;
      }

      // HIGH-4: Use /internal/reminders which validates X-Internal-Token, not a user JWT
      const res = await fetch(`${baseUrl}/internal/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': internalToken
        },
        body: JSON.stringify(bodyPayload)
      });
      if (!res.ok) console.error(`Sandbox Reminder failed: [${res.status}]`);
    } catch (err: any) {
      console.error(`Local Sandbox Reminder fetch crash: ${err.message}`);
    }
  };

  const context: Context = {
    input: normalizedInput,
    ai,
    expense,
    reply,
    session,
    setting,
    media: payload.media,
    remind,
  };

  return Object.freeze(context);
}
