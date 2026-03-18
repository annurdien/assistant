import { PrismaClient, type Command } from './generated/prisma/client.js';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assistant?schema=public';
const pool = new pg.Pool({ connectionString });
// @ts-ignore
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
