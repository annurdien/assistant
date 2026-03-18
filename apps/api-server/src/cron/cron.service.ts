import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '@assistant/database';
import { executeCommand } from '@assistant/core';
import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('cron-scheduler');

// Store active tasks so we can destroy them on reload
const activeTasks: ScheduledTask[] = [];

export async function initCronScheduler() {
  logger.info('Initializing CRON scheduler subsystem...');

  // Stop all previously scheduled tasks to avoid duplicates on restart
  for (const task of activeTasks) {
    task.stop();
  }
  activeTasks.length = 0;

  try {
    const jobs = await prisma.cronJob.findMany({
      where: { enabled: true }
    });

    for (const job of jobs) {
      if (!cron.validate(job.schedule)) {
        logger.warn(`Skipping job ${job.id} due to invalid CRON schedule: ${job.schedule}`);
        continue;
      }

      const task = cron.schedule(job.schedule, async () => {
        logger.info(`[CRON] Executing scheduled job: ${job.id}`);

        try {
          const command = await prisma.command.findUnique({
            where: { id: job.commandId }
          });

          if (!command) {
            logger.warn(`[CRON] Command ${job.commandId} not found for job ${job.id}. Attempting to disable job.`);
            await prisma.cronJob.update({ where: { id: job.id }, data: { enabled: false } });
            return;
          }

          if (!command.enabled) {
             logger.info(`[CRON] Command ${command.name} is disabled. Skipping execution.`);
             return;
          }

          const payload = {
             input: '', // Cron executions theoretically have no manual input
             jid: job.targetJid
          };

          await executeCommand(command.script, payload, async (msg: string) => {
            if (job.targetJid) {
              try {
                await fetch('http://localhost:3001/reply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jid: job.targetJid, text: `*[CRON: ${command.name}]*\n\n${msg}` })
                });
              } catch (err: any) {
                logger.warn(`[CRON] Failed to dispatch webhook reply constraint: ${err.message}`);
              }
            }
          });
        } catch (err: any) {
           logger.error(`[CRON] Execution cascade failed for job ${job.id}: ${err.message}`);
        }
      });

      activeTasks.push(task);
      logger.info(`[CRON] Job ${job.id} scheduled gracefully at '${job.schedule}' (Target: ${job.targetJid})`);
    }

    logger.info(`Subsystem locked: ${activeTasks.length} active CRON circuits loaded.`);
  } catch (err: any) {
    logger.error(`Fatal crash in CRON module bootstrap: ${err.message}`);
  }
}
