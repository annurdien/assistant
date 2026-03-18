import * as vm from 'vm';
import { createContext } from '@assistant/sdk';

export async function executeInSandbox(code: string, input: string): Promise<any> {
  const executableCode = code.replace(/export\s+default\s+/, 'module.exports = ');

  const sandboxExports: any = {};
  const sandboxModule = { exports: sandboxExports };

  const vmContext = vm.createContext({
    module: sandboxModule,
    exports: sandboxExports,
  });

  try {
    const script = new vm.Script(executableCode);

    script.runInContext(vmContext, { timeout: 1000 });

    const executableFunction = sandboxModule.exports.default || sandboxModule.exports;

    if (typeof executableFunction !== 'function') {
      throw new Error('Sandbox Error: The provided script did not export a default valid function.');
    }

    const contextPayload = createContext(input);

    const result = await Promise.resolve(executableFunction(contextPayload));

    return result;
  } catch (error: any) {
    throw new Error(`Execution Failed: ${error.message}`);
  }
}
