import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

// Only these keys may be written by API callers
const ALLOWED_SETTING_KEYS = new Set([
  'WA_COMMAND_PREFIX',
  'WA_MAINTENANCE_MODE',
  'AI_API_KEY',
  'AI_MODEL',
  'WA_BOT_NAME',
  'WA_WELCOME_MESSAGE',
  'CURRENCY_LOCALE',
  'CURRENCY_CODE',
]);

export default async function settingsRoutes(fastify: FastifyInstance) {
  // All settings routes are protected
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async () => {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  });

  fastify.post('/', async (request, reply) => {
    const body = request.body as Record<string, string>;

    // Only allow updating whitelisted keys
    const invalidKeys = Object.keys(body).filter(k => !ALLOWED_SETTING_KEYS.has(k));
    if (invalidKeys.length > 0) {
      return reply.status(400).send({ error: `Unknown or forbidden setting key(s): ${invalidKeys.join(', ')}` });
    }

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
