import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function whatsappRoutes(fastify: FastifyInstance) {
  // Protect all routes with JWT (Admin/Dashboard access only)
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Proxy the request to the internal WhatsApp service running on port 3001
      const response = await fetch('http://localhost:3001/status');
      
      if (!response.ok) {
        return reply.status(response.status).send({ error: 'Failed to reach WhatsApp service' });
      }

      const data = await response.json();
      return reply.send(data);
    } catch (error: any) {
      fastify.log.error(`WhatsApp Service Proxy Error: ${error.message}`);
      return reply.status(503).send({ error: 'WhatsApp service is unavailable or starting up.' });
    }
  });
}
