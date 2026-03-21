import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

export default async function logsRoutes(fastify: FastifyInstance) {
  // All log routes are protected
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.get('/', async (request) => {
    const query = request.query as any;
    const limit = Math.min(query.limit ? parseInt(query.limit) : 50, 500);
    
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return logs;
  });
}
