import Fastify from 'fastify';
import { parseCommand, executeCommand } from '@assistant/core';
import { getCommandByName, CommandNotFoundError, CommandDisabledError } from './commandRegistry.js';
import { commandRoutes } from './routes/commands.js';
import cors from '@fastify/cors';
import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('api-server');

export function buildServer() {
  const server = Fastify({
    logger: false
  });

  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  server.register(commandRoutes, { prefix: '/commands' });

  server.post('/execute', async (request, reply) => {
    try {
      const body = request.body as { text?: string; jid?: string };

      if (!body || typeof body.text !== 'string') {
        return reply.status(400).send({ error: "Missing or invalid 'text' field in request body." });
      }

      const parsed = parseCommand(body.text);
      if (!parsed) {
        return reply.status(400).send({ error: "Invalid command format. Ensure it starts with '/'." });
      }

      const command = await getCommandByName(parsed.command);

      const input = parsed.args.join(' ');

      logger.info(`Orchestrating command execution: '${command.name}' with input: '${input}'`);

      const executionResult = await executeCommand(command.script, input, async (msg: string) => {
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

      return reply.send({
        success: executionResult.success,
        output: executionResult.output,
      });

    } catch (error: any) {
      logger.error(`Failed to execute command: ${error.message}`);
      
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
