import { prisma, type Command } from '@assistant/database';

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
