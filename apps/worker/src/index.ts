import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('worker');

async function main(): Promise<void> {
  logger.info('Worker starting...');
}

main().catch((err: unknown) => {
  console.error('Fatal error in worker:', err);
  process.exit(1);
});
