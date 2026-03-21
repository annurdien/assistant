import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

export default async function secretsRoutes(server: FastifyInstance) {
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // GET returns masked secret values (HIGH-3 fix — prevent exfiltration via stolen JWT)
  server.get('/', async (_request, _reply) => {
    const secrets = await prisma.secret.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return secrets.map(s => ({
      id: s.id,
      key: s.key,
      value: '••••••••',   // Never return the real value in a list
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
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
      // Don't echo back the value
      return reply.status(201).send({ id: secret.id, key: secret.key, value: '••••••••' });
    } catch {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.secret.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
