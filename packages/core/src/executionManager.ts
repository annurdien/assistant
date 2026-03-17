import { fork } from 'child_process';
import path from 'path';

export class ExecutionTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Command execution timed out after ${timeoutMs}ms.`);
    this.name = 'ExecutionTimeoutError';
  }
}

export class ExecutionFailedError extends Error {
  constructor(message: string) {
    super(`Command execution failed: ${message}`);
    this.name = 'ExecutionFailedError';
  }
}

export interface CommandExecutionResult {
  output: string;
  success: boolean;
}

/**
 * Executes a command script in a separate Node.js process.
 * 
 * @param commandScript The JavaScript code of the command to execute
 * @param input The input arguments/data for the command
 * @returns The result of the command execution
 */
export async function executeCommand(commandScript: string, input: any): Promise<CommandExecutionResult> {
  return new Promise((resolve, reject) => {
    // We execute a generic worker script that will eval the commandScript
    // By convention, assume the worker is compiled to the same directory and extension
    const ext = path.extname(__filename);
    const workerPath = path.resolve(__dirname, `../../../apps/worker/dist/worker${ext}`);
    
    // Spawn a child process
    const child = fork(workerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Give AI requests 30s to respond before killing the VM.
    const timeoutMs = 30000;
    
    // Set a timeout to kill the process if it takes too long
    const timeoutId = setTimeout(() => {
      child.kill();
      reject(new ExecutionTimeoutError(timeoutMs));
    }, timeoutMs);

    // Listen for messages from the worker
    child.on('message', (message: any) => {
      clearTimeout(timeoutId);
      child.kill();
      
      if (message.error) {
        reject(new ExecutionFailedError(message.error));
      } else {
        resolve({
          output: message.result,
          success: true
        });
      }
    });

    // Handle unexpected worker exit
    child.on('exit', (code) => {
      clearTimeout(timeoutId);
      if (code !== 0 && code !== null) {
        reject(new ExecutionFailedError(`Worker exited with code ${code}`));
      }
    });

    // Handle child process errors
    child.on('error', (err) => {
      clearTimeout(timeoutId);
      child.kill();
      reject(new ExecutionFailedError(err.message));
    });

    // Send the command script and input to the worker
    child.send({ script: commandScript, input });
  });
}
