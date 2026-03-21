import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';
import { scheduleNewReminder } from '../cron/reminder.service.js';

export default async function reminderRoutes(server: FastifyInstance) {
  // Protect all reminder routes — without this anyone can send WA messages to any number
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  server.post('/', async (request, reply) => {
    const { targetJid, text, minutes, executeAt: executeAtStr } = request.body as any;
    
    if (!targetJid || !text) {
      return reply.status(400).send({ error: 'Missing required configuration arguments.' });
    }

    let executeAt: Date;
    if (executeAtStr) {
      executeAt = new Date(executeAtStr);
    } else if (typeof minutes === 'number') {
      executeAt = new Date(Date.now() + minutes * 60000);
    } else {
      return reply.status(400).send({ error: 'Missing timing configuration (minutes or executeAt).' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        executeAt,
        targetJid,
        text
      }
    });

    scheduleNewReminder(reminder);

    return reply.status(201).send(reminder);
  });
}
