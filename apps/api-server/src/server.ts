import Fastify from 'fastify';
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
import multipart from '@fastify/multipart';

const logger = new ConsoleLogger('api-server');

export function buildServer() {
  const server = Fastify({
    logger: false
  });

  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret_fallback_key_change_me'
  });

  server.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB maximum payload
  });

  server.register(authRoutes, { prefix: '/auth' });
  server.register(settingsRoutes, { prefix: '/settings' });
  server.register(logsRoutes, { prefix: '/logs' });
  server.register(cronRoutes, { prefix: '/cron' });
  server.register(reminderRoutes, { prefix: '/reminders' });
  server.register(secretsRoutes, { prefix: '/secrets' });
  server.register(whitelistRoutes, { prefix: '/whitelist' });
  server.register(kbRoutes, { prefix: '/api/kb' });

  server.register(commandRoutes, { prefix: '/commands' });

  server.post('/execute', async (request, reply) => {
    try {
      const body = request.body as { text?: string; jid?: string; media?: any };

      if (!body || typeof body.text !== 'string') {
        return reply.status(400).send({ error: "Missing or invalid 'text' field in request body." });
      }

      const parsed = parseCommand(body.text);
      if (!parsed) {
        return reply.status(400).send({ error: "Invalid command format. Ensure it starts with '/'." });
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
