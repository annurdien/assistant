import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body as any;

      if (!username || !password) {
        return reply.status(400).send({ error: 'Username and password required' });
      }

      const admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);

      if (!isMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ id: admin.id, username: admin.username }, { expiresIn: '8h' });
      return { token };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Verify route to check if a token is valid
  fastify.get('/me', {
    onRequest: [async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }]
  }, async (request, _reply) => {
    return { user: request.user };
  });
}
