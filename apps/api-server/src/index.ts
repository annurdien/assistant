/**
 * @assistant/api-server
 * Entry point for the API server.
 */

import { ConsoleLogger } from '@assistant/services';

import { buildServer } from './server.js';

const logger = new ConsoleLogger('api-server');

async function main(): Promise<void> {
  logger.info('API server starting...');
  const server = buildServer();
  
  await server.listen({ port: 3000, host: '0.0.0.0' });
  logger.info(`Server listening on \${(server.server.address() as any)?.port}`);
}

main().catch((err: unknown) => {
  console.error('Fatal error in api-server:', err);
  process.exit(1);
});
