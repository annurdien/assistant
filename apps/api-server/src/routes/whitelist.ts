import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

export default async function whitelistRoutes(server: FastifyInstance) {
  // Protect all operations behind JWT authentication
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.get('/', async (_request, _reply) => {
    const whitelist = await prisma.whitelist.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return whitelist;
  });

  server.post('/', async (request, reply) => {
    const { jid, name } = request.body as { jid: string; name?: string };
    
    if (!jid) {
      return reply.status(400).send({ error: 'Missing JID' });
    }

    try {
      const entry = await prisma.whitelist.upsert({
        where: { jid },
        update: { name: name ?? null },
        create: { jid, name: name ?? null }
      });
      return reply.status(201).send(entry);
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return reply.status(409).send({ error: 'JID already exists in whitelist' });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.whitelist.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(404).send({ error: 'Whitelist entry not found' });
    }
  });
}
