import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';
import { initCronScheduler } from '../cron/cron.service.js';
import cron from 'node-cron';

export default async function cronRoutes(server: FastifyInstance) {
  // Enforce JWT Auth boundary
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.get('/', async (_request, reply) => {
    const jobs = await prisma.cronJob.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const commands = await prisma.command.findMany({
      select: { id: true, name: true }
    });

    // Hydrate the payload with the target command names gracefully
    const mappedJobs = jobs.map(job => {
      const parentCommand = commands.find(c => c.id === job.commandId);
      return {
         ...job,
         commandName: parentCommand?.name || 'Unknown Command'
      };
    });

    return reply.send(mappedJobs);
  });

  server.post('/', async (request, reply) => {
    const { commandId, schedule, targetJid, enabled } = request.body as any;

    if (!commandId || !schedule || !targetJid) {
       return reply.status(400).send({ error: "Missing required fields: commandId, schedule, or targetJid" });
    }

    // MED-2: Validate cron expression format
    if (!cron.validate(schedule)) {
      return reply.status(400).send({ error: 'Invalid cron schedule expression. Example: "0 8 * * *"' });
    }

    const job = await prisma.cronJob.create({
      data: { commandId, schedule, targetJid, enabled: enabled ?? true }
    });

    // Hot-reload the background loop
    initCronScheduler();

    return reply.status(201).send(job);
  });

  server.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    // Whitelist only safe fields to prevent mass assignment
    const { schedule, targetJid, enabled } = request.body as any;
    const data: any = {};
    if (schedule !== undefined) {
      // MED-2: Validate cron expression before storing
      if (!cron.validate(schedule)) {
        return reply.status(400).send({ error: 'Invalid cron schedule expression. Example: "0 8 * * *"' });
      }
      data.schedule = schedule;
    }
    if (targetJid !== undefined) data.targetJid = targetJid;
    if (enabled !== undefined) data.enabled = enabled;

    const job = await prisma.cronJob.update({
      where: { id },
      data
    });

    // Hot-reload the background loop
    initCronScheduler();

    return reply.send(job);
  });

  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.cronJob.delete({ where: { id } });

    // Hot-reload the background loop
    initCronScheduler();

    return reply.send({ success: true });
  });
}
