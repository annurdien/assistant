import { ChildProcess, fork } from 'child_process';
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

interface WorkerNode {
  process: ChildProcess;
  busy: boolean;
}

class WorkerPool {
  private workers: WorkerNode[] = [];
  private taskQueue: Array<(worker: WorkerNode) => void> = [];

  constructor(poolSize: number = 3) {
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(this.createWorker());
    }
  }

  private createWorker(): WorkerNode {
    const ext = path.extname(__filename);
    const workerPath = path.resolve(__dirname, `../../../apps/worker/dist/worker${ext}`);
    
    const child = fork(workerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    const workerNode: WorkerNode = { process: child, busy: false };

    child.on('exit', () => {
      const index = this.workers.indexOf(workerNode);
      if (index !== -1) {
        this.workers[index] = this.createWorker();
      }
    });

    return workerNode;
  }

  private async acquireWorker(): Promise<WorkerNode> {
    const availableWorker = this.workers.find(w => !w.busy);
    if (availableWorker) {
      availableWorker.busy = true;
      return availableWorker;
    }

    return new Promise(resolve => {
      this.taskQueue.push((worker) => {
        worker.busy = true;
        resolve(worker);
      });
    });
  }

  private releaseWorker(worker: WorkerNode) {
    worker.process.removeAllListeners('message');
    worker.process.removeAllListeners('error');
    
    const resolveNextTask = this.taskQueue.shift();
    if (resolveNextTask) {
      resolveNextTask(worker);
    } else {
      worker.busy = false;
    }
  }

  public async execute(commandScript: string, input: any, onReply?: (msg: string) => void): Promise<CommandExecutionResult> {
    const worker = await this.acquireWorker();

    return new Promise((resolve, reject) => {
      const child = worker.process;
      const timeoutMs = 30000;
      
      const timeoutId = setTimeout(() => {
        child.kill(); // The exit handler will recreate the worker
        this.releaseWorker(worker);
        reject(new ExecutionTimeoutError(timeoutMs));
      }, timeoutMs);

      child.on('message', (message: any) => {
        if (message.type === 'reply') {
          if (onReply) onReply(message.message);
          return;
        }

        clearTimeout(timeoutId);
        this.releaseWorker(worker);
        
        if (message.error) {
          reject(new ExecutionFailedError(message.error));
        } else {
          resolve({
            output: message.result,
            success: true
          });
        }
      });

      child.once('error', (err) => {
        clearTimeout(timeoutId);
        child.kill();
        this.releaseWorker(worker);
        reject(new ExecutionFailedError(err.message));
      });

      child.send({ script: commandScript, input });
    });
  }
}

// Singleton global pool initialized with 3 persistent workers
const globalWorkerPool = new WorkerPool(3);

/**
 * Executes a command script safely returning the context via an IPC worker pool.
 */
export async function executeCommand(commandScript: string, input: any, onReply?: (msg: string) => void): Promise<CommandExecutionResult> {
  return globalWorkerPool.execute(commandScript, input, onReply);
}
