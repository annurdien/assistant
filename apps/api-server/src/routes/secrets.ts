import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

export default async function secretsRoutes(server: FastifyInstance) {
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.get('/', async (_request, _reply) => {
    const secrets = await prisma.secret.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return secrets;
  });

  server.post('/', async (request, reply) => {
    const { key, value } = request.body as { key: string; value: string };
    
    if (!key || !value) {
      return reply.status(400).send({ error: 'Missing configuration key or value' });
    }

    try {
      const secret = await prisma.secret.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
      return reply.status(201).send(secret);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.secret.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
