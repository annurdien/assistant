import { executeInSandbox } from './sandbox.js';

/**
 * Standalone worker process used by executionManager.
 * 
 * Receives `{ script, input }` via IPC.
 * Initializes the tight V8 sandbox with the isolated SDK payloads securely.
 * Sends result or error back via IPC.
 * Exits the process when done.
 */

process.on('message', async (message: { script: string; input: string }) => {
  try {
    const { script, input } = message;

    // Load the script and context natively executing it in isolated bounds
    const result = await executeInSandbox(script, input);

    // Send the execution result reliably back to the core manager parent process 
    if (process.send) {
      process.send({ result });
    }
    
    // Process graceful exit
    process.exit(0);
  } catch (error: any) {
    // Escalate the sandboxed sanitised error to the API server log channel
    if (process.send) {
      process.send({ error: error.message || String(error) });
    }
    
    process.exit(1);
  }
});
