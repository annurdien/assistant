import { executeInSandbox } from './sandbox.js';

process.on('message', async (message: { script: string; payload: any }) => {
  try {
    const { script, payload } = message;

    const result = await executeInSandbox(script, payload, async (msg) => {
      if (process.send) {
        process.send({ type: 'reply', message: msg });
      }
    });

    if (process.send) {
      process.send({ result });
    }
    
    process.exit(0);
  } catch (error: any) {
    if (process.send) {
      process.send({ error: error.message || String(error) });
    }
    
    process.exit(1);
  }
});
