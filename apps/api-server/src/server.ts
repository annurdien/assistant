import Fastify from 'fastify';
import { parseCommand, executeCommand } from '@assistant/core';
import { getCommandByName, CommandNotFoundError, CommandDisabledError } from './commandRegistry.js';
import { commandRoutes } from './routes/commands.js';
import cors from '@fastify/cors';
import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('api-server');

export function buildServer() {
  const server = Fastify({
    logger: false // Use custom logger where needed, or true for Fastify's built-in Pino
  });

  server.register(cors, {
    origin: '*', // Allow all origins for local development
  });

  // Register the Command CRUD API routes
  server.register(commandRoutes, { prefix: '/commands' });

  server.post('/execute', async (request, reply) => {
    try {
      const body = request.body as { text?: string };

      if (!body || typeof body.text !== 'string') {
        return reply.status(400).send({ error: "Missing or invalid 'text' field in request body." });
      }

      // 1. Parse command
      const parsed = parseCommand(body.text);
      if (!parsed) {
        return reply.status(400).send({ error: "Invalid command format. Ensure it starts with '/'." });
      }

      // 2. Fetch command by name from DB
      const command = await getCommandByName(parsed.command);

      // 3. Derive the specific input for the command script (everything after the command name)
      // E.g., "/expense 100 coffee" -> input is "100 coffee"
      const input = parsed.args.join(' ');

      logger.info(`Orchestrating command execution: '${command.name}' with input: '${input}'`);

      // 4. Call Execution Manager
      // We pass the raw code script from the DB, and the derived input context
      const executionResult = await executeCommand(command.script, input);

      // 5. Return result
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

      // Timeout or Execution errors
      if (error.name === 'ExecutionTimeoutError' || error.name === 'ExecutionFailedError') {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  return server;
}
