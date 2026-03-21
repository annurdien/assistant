import type { FastifyInstance } from 'fastify';
import { prisma, type Command } from '@assistant/database';

export async function commandRoutes(fastify: FastifyInstance) {

  // Protect all command routes behind JWT authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async (_request, reply) => {
    const commands = await prisma.command.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(commands);
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const command = await prisma.command.findUnique({
        where: { id },
      });
      if (!command) {
        return reply.status(404).send({ error: 'Command not found' });
      }
      return reply.send(command);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
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

      const existing = await prisma.command.findUnique({ where: { id } });
      if (!existing) return reply.status(404).send({ error: 'Command not found' });

      const dataToUpdate: Record<string, any> = {};
      if (body.name !== undefined) dataToUpdate.name = body.name;
      if (body.description !== undefined) dataToUpdate.description = body.description;
      if (body.enabled !== undefined) dataToUpdate.enabled = body.enabled;

      if (!existing.isBuiltIn && body.script !== undefined) {
        dataToUpdate.script = body.script;
      }

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
      
      const existing = await prisma.command.findUnique({ where: { id } });
      if (!existing) return reply.status(404).send({ error: 'Command not found' });

      if (existing.isBuiltIn) {
        return reply.status(403).send({ error: 'Cannot delete a built-in core command.' });
      }

      await prisma.command.delete({
        where: { id },
      });

      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
