import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

export default async function settingsRoutes(fastify: FastifyInstance) {
  // All settings routes are protected
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.get('/', async () => {
    const settings = await prisma.setting.findMany();
    // Return an object mapped by key: value
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  });

  fastify.post('/', async (request) => {
    const body = request.body as Record<string, string>;
    
    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return { success: true };
  });
}
