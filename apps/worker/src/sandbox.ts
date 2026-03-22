import * as vm from 'vm';
import { createContext, type ExecutionContextData } from '@assistant/sdk';

// Dangerous globals that must be stripped from the sandbox context.
// Node's vm module is NOT a security boundary by itself — these must be
// explicitly blocked to prevent trivial constructor-chain escapes.
const BLOCKED_GLOBALS = [
  'process', 'require', 'Buffer', 'setImmediate', 'clearImmediate',
  '__dirname', '__filename', 'global', 'globalThis', 'eval',
  'Function', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
];

export async function executeInSandbox(code: string, payload: ExecutionContextData, replyCallback?: (msg: string) => Promise<void>): Promise<any> {
  const executableCode = code.replace(/export\s+default\s+/, 'module.exports = ');

  const sandboxExports: any = {};
  const sandboxModule = { exports: sandboxExports };

  // Build a minimal, locked-down context — no access to Node.js internals
  const rawContext: Record<string, any> = {
    module: sandboxModule,
    exports: sandboxExports,
    console: {
      log: (...args: any[]) => console.log('[sandbox]', ...args),
      error: (...args: any[]) => console.error('[sandbox]', ...args),
      warn: (...args: any[]) => console.warn('[sandbox]', ...args),
    },
    // HIGH-3: Promise intentionally EXCLUDED to prevent .constructor.constructor() RCE escape.
    // The executor is run via Promise.race externally. Scripts that need async should use
    // the provided ctx.reply(), ctx.ai.ask() etc. which are async-wrapped at call time.
    JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Error,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  };

  // Explicitly null-out all dangerous globals so prototype chain escapes return null
  for (const key of BLOCKED_GLOBALS) {
    rawContext[key] = undefined;
  }

  // Freeze the context object itself to prevent mutation
  const vmContext = vm.createContext(Object.freeze(rawContext));

  try {
    const script = new vm.Script(executableCode);

    // Short timeout for the synchronous compilation phase only
    script.runInContext(vmContext, { timeout: 1000 });

    const executableFunction = sandboxModule.exports.default || sandboxModule.exports;

    if (typeof executableFunction !== 'function') {
      throw new Error('Sandbox Error: The provided script did not export a default valid function.');
    }

    const contextPayload = createContext(payload, replyCallback);

    // Longer timeout for the async execution phase
    const result = await Promise.race([
      Promise.resolve(executableFunction(contextPayload)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timed out after 25s')), 25000)
      )
    ]);

    return result;
  } catch (error: any) {
    throw new Error(`Execution Failed: ${error.message}`);
  }
}
