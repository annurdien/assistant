/**
 * @assistant/worker
 * Entry point for the background worker.
 */

import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('worker');

async function main(): Promise<void> {
  logger.info('Worker starting...');
  // TODO: initialize job queue and register task handlers
}

main().catch((err: unknown) => {
  console.error('Fatal error in worker:', err);
  process.exit(1);
});
