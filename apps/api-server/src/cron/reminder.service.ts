import schedule from 'node-schedule';
import { prisma } from '@assistant/database';
import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('reminder-scheduler');

async function executeReminder(reminder: { id: string; targetJid: string; text: string; executeAt: Date }) {
  try {
    // Push to the WhatsApp sender webhook
    await fetch('http://localhost:3001/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        jid: reminder.targetJid, 
        text: `⏰ *Reminder:*\n\n${reminder.text}` 
      })
    });
    
    // Delete once successfully dispatched
    await prisma.reminder.delete({ where: { id: reminder.id } });
    logger.info(`Successfully dispatched exact-time reminder ${reminder.id}`);
  } catch (err: any) {
    logger.error(`Failed to dispatch reminder ${reminder.id}: ${err.message}`);
  }
}

export function scheduleNewReminder(reminder: { id: string; targetJid: string; text: string; executeAt: Date }) {
    const job = schedule.scheduleJob(reminder.id, reminder.executeAt, () => {
      executeReminder(reminder);
    });
    if (job) {
        logger.info(`Scheduled new precision event memory trigger for reminder ${reminder.id} at ${reminder.executeAt}`);
    } else {
        logger.warn(`Failed to schedule precision event for reminder ${reminder.id}. Target Date: ${reminder.executeAt}`);
    }
}

export async function initReminderScheduler() {
  logger.info('Initializing Push-Based Reminder Event Engine...');

  try {
      const now = new Date();
      const pendingReminders = await prisma.reminder.findMany();
      
      let recoveredCount = 0;

      for (const reminder of pendingReminders) {
        if (reminder.executeAt <= now) {
            // Execute immediately if we missed it while the server was down
            await executeReminder(reminder);
            logger.info(`Fired stale reminder ${reminder.id} retroactively.`);
        } else {
            // Queue for the exact millisecond in the future
            scheduleNewReminder(reminder);
            recoveredCount++;
        }
      }
      
      logger.info(`Successfully loaded ${recoveredCount} pending precise-time reminders into node-schedule memory registry.`);
  } catch (err: any) {
      logger.error(`Reminder Engine initialization crash: ${err.message}`);
  }
}
