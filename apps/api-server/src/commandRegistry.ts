import { PrismaClient, type Command } from './generated/prisma/client.js';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assistant?schema=public';
const pool = new pg.Pool({ connectionString });
// @ts-ignore - ignore pool version collision
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

export class CommandNotFoundError extends Error {
  constructor(name: string) {
    super(`Command '${name}' not found.`);
    this.name = 'CommandNotFoundError';
  }
}

export class CommandDisabledError extends Error {
  constructor(name: string) {
    super(`Command '${name}' is disabled.`);
    this.name = 'CommandDisabledError';
  }
}

/**
 * Fetches a command by name from the database and validates if it is enabled.
 * 
 * @param name The name of the command to fetch
 * @returns The Command object if found and enabled
 * @throws {CommandNotFoundError} If the command is not found in the database
 * @throws {CommandDisabledError} If the command is found but not enabled
 */
export async function getCommandByName(name: string): Promise<Command> {
  const command = await prisma.command.findUnique({
    where: { name }
  });

  if (!command) {
    throw new CommandNotFoundError(name);
  }

  if (!command.enabled) {
    throw new CommandDisabledError(name);
  }

  return command;
}
