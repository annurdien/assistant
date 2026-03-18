import { executeInSandbox } from './sandbox.js';

process.on('message', async (message: { script: string; input: string }) => {
  try {
    const { script, input } = message;

    const result = await executeInSandbox(script, input);

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
