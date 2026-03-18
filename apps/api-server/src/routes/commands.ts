import type { FastifyInstance } from 'fastify';
import { PrismaClient, type Command } from '../generated/prisma/client.js';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assistant?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

export async function commandRoutes(fastify: FastifyInstance) {
  
  fastify.get('/', async (_request, reply) => {
    const commands = await prisma.command.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(commands);
  });

  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as Partial<Command>;
      
      if (!body.name || !body.script) {
        return reply.status(400).send({ error: 'Fields "name" and "script" are required.' });
      }

      const command = await prisma.command.create({
        data: {
          name: body.name,
          description: body.description || null,
          script: body.script,
          enabled: body.enabled ?? true,
        },
      });
      
      return reply.status(201).send(command);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as Partial<Command>;

      const dataToUpdate: Record<string, any> = {};
      if (body.name !== undefined) dataToUpdate.name = body.name;
      if (body.description !== undefined) dataToUpdate.description = body.description;
      if (body.script !== undefined) dataToUpdate.script = body.script;
      if (body.enabled !== undefined) dataToUpdate.enabled = body.enabled;

      const command = await prisma.command.update({
        where: { id },
        data: dataToUpdate,
      });

      return reply.send(command);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await prisma.command.delete({
        where: { id },
      });

      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
