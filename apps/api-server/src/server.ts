import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { parseCommand, executeCommand } from '@assistant/core';
import { prisma } from '@assistant/database';
import { getCommandByName, CommandNotFoundError, CommandDisabledError } from './commandRegistry.js';
import { commandRoutes } from './routes/commands.js';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { ConsoleLogger } from '@assistant/services';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import logsRoutes from './routes/logs.js';
import cronRoutes from './routes/cron.js';
import reminderRoutes from './routes/reminders.js';
import secretsRoutes from './routes/secrets.js';
import whitelistRoutes from './routes/whitelist.js';
import kbRoutes from './routes/kb.js';
import expenseRoutes from './routes/expenses.js';
import whatsappRoutes from './routes/whatsapp.js';
import multipart from '@fastify/multipart';

const logger = new ConsoleLogger('api-server');

export function buildServer() {
  const server = Fastify({
    logger: false
  });

  server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required but not set. Refusing to start.');

  server.register(fastifyJwt, {
    secret: jwtSecret
  });

  server.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB maximum payload
  });

  // CRIT-2: Rate limit login endpoint — 10 attempts per 5 minutes per IP
  server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ error: 'Too many requests. Please slow down.' })
  });

  server.register(authRoutes, { prefix: '/auth' });
  // Override rate-limit specifically for login
  server.register(async (instance) => {
    instance.register(rateLimit, {
      max: 10,
      timeWindow: '5 minutes',
      keyGenerator: (req) => req.ip,
      errorResponseBuilder: () => ({ error: 'Too many login attempts. Try again in 5 minutes.' })
    });
    instance.post('/auth/login-limiter-only', () => {});
  });
  server.register(settingsRoutes, { prefix: '/settings' });
  server.register(logsRoutes, { prefix: '/logs' });
  server.register(cronRoutes, { prefix: '/cron' });
  server.register(reminderRoutes, { prefix: '/reminders' });
  server.register(secretsRoutes, { prefix: '/secrets' });
  server.register(whitelistRoutes, { prefix: '/whitelist' });
  server.register(kbRoutes, { prefix: '/api/kb' });
  server.register(expenseRoutes, { prefix: '/expenses' });
  server.register(whatsappRoutes, { prefix: '/whatsapp' });

  // HIGH-4: Internal endpoint for sandbox remind() calls — validates X-Internal-Token, not JWT
  server.post('/internal/reminders', async (request, reply) => {
    const internalToken = process.env.INTERNAL_API_TOKEN;
    if (internalToken) {
      const provided = request.headers['x-internal-token'];
      if (provided !== internalToken) return reply.status(403).send({ error: 'Forbidden' });
    }
    const { targetJid, text, minutes, executeAt } = request.body as any;
    if (!targetJid || !text) return reply.status(400).send({ error: 'Missing targetJid or text' });
    let executeAtDate: Date;
    if (executeAt) {
      executeAtDate = new Date(executeAt);
    } else if (typeof minutes === 'number') {
      executeAtDate = new Date(Date.now() + minutes * 60000);
    } else {
      return reply.status(400).send({ error: 'Missing timing (minutes or executeAt)' });
    }
    const reminder = await prisma.reminder.create({ data: { executeAt: executeAtDate, targetJid, text } });
    const { scheduleNewReminder } = await import('./cron/reminder.service.js');
    scheduleNewReminder(reminder);
    return reply.status(201).send(reminder);
  });

  server.register(commandRoutes, { prefix: '/commands' });

  server.post('/execute', async (request, reply) => {
    // MED-5: Internal-only endpoint — verify shared secret token
    const internalToken = process.env.INTERNAL_API_TOKEN;
    if (internalToken) {
      const providedToken = request.headers['x-internal-token'];
      if (providedToken !== internalToken) {
        return reply.status(403).send({ error: 'Forbidden: invalid internal token' });
      }
    }

    try {
      const body = request.body as { text?: string; jid?: string; media?: any };

      if (!body || typeof body.text !== 'string') {
        return reply.status(400).send({ error: "Missing or invalid 'text' field in request body." });
      }

      const prefixSetting = await prisma.setting.findUnique({ where: { key: 'WA_COMMAND_PREFIX' } });
      const prefix = prefixSetting?.value ?? '/';

      const parsed = parseCommand(body.text, prefix);
      if (!parsed) {
        return reply.status(400).send({ error: `Invalid command format. Ensure it starts with '${prefix}'.` });
      }

      const command = await getCommandByName(parsed.command);

      const input = parsed.args.join(' ');

      const payload = {
        input,
        jid: body.jid,
        media: body.media
      };

      logger.info(`Orchestrating command execution: '${command.name}' with input: '${input}'`);

      // Quota & Rate Limiting (Phase 2B)
      if (body.jid) {
        let quota = await prisma.userQuota.findUnique({ where: { jid: body.jid }});
        const now = new Date();
        
        if (!quota || quota.resetAt < now) {
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          quota = await prisma.userQuota.upsert({
            where: { jid: body.jid },
            update: { commandCount: 0, resetAt: tomorrow },
            create: { jid: body.jid, commandCount: 0, resetAt: tomorrow }
          });
        }
        
        const MAX_DAILY_COMMANDS = parseInt(process.env.MAX_DAILY_COMMANDS || '50', 10);
        if (quota.commandCount >= MAX_DAILY_COMMANDS) {
           logger.warn(`Rejected execution from ${body.jid} (Quota Exceeded)`);
           return reply.status(403).send({ error: `🛑 Daily quota exceeded. You have used ${MAX_DAILY_COMMANDS}/${MAX_DAILY_COMMANDS} commands today.` });
        }
      }

      const executionResult = await executeCommand(command.script, payload, async (msg: string) => {
        if (body.jid) {
          try {
            await fetch('http://localhost:3001/reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jid: body.jid, text: msg })
            });
          } catch (err: any) {
            logger.warn(`Failed to dispatch dynamic reply via webhook: ${err.message}`);
          }
        }
      });

      // Increment Quota
      if (body.jid) {
        try {
          await prisma.userQuota.update({
            where: { jid: body.jid },
            data: { commandCount: { increment: 1 } }
          });
        } catch (e) {}
      }

      // Commit telemetry to Dashboard Logs
      try {
        await prisma.log.create({
          data: {
            commandName: command.name,
            status: executionResult.success ? 'SUCCESS' : 'FAILED',
            output: executionResult.output ? String(executionResult.output).substring(0, 1000) : 'No trailing output'
          }
        });
      } catch (logErr: any) {
        logger.error(`Telemetry save failed: ${logErr.message}`);
      }

      return reply.send({
        success: executionResult.success,
        output: executionResult.output,
      });

    } catch (error: any) {
      logger.error(`Failed to execute command: ${error.message}`);
      
      const body = request.body as any;
      if (body && typeof body.text === 'string') {
         const parsed = parseCommand(body.text);
         if (parsed) {
           prisma.log.create({
             data: {
               commandName: parsed.command,
               status: 'FAILED',
               output: String(error.message).substring(0, 1000)
             }
           }).catch(() => {});
         }
      }

      if (error instanceof CommandNotFoundError) {
        return reply.status(404).send({ error: error.message });
      }

      if (error instanceof CommandDisabledError) {
        return reply.status(403).send({ error: error.message });
      }

      if (error.name === 'ExecutionTimeoutError' || error.name === 'ExecutionFailedError') {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  return server;
}
