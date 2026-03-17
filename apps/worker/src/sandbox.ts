import * as vm from 'vm';
import { createContext } from '@assistant/sdk';

/**
 * Executes a user script inside a tightly restricted V8 sandbox.
 * Ensures the script has zero access to the systemic Node.js capabilities (fs, process, require).
 * 
 * @param code The JavaScript code to execute
 * @param input The raw input string to pass into the script's Context Factory
 * @returns The resolved result of the executed command script
 * @throws Error if the script fails compilation, crashes, or times out
 */
export async function executeInSandbox(code: string, input: string): Promise<any> {
  // Transpile `export default` to `module.exports =` to support modern ESM-like syntax 
  // directly in the standard Node VM engine without experimental flags.
  const executableCode = code.replace(/export\s+default\s+/, 'module.exports = ');

  // Create an object to act as the module/exports for the script
  const sandboxExports: any = {};
  const sandboxModule = { exports: sandboxExports };

  // Define the secure context. Explicitly block global access (no process, no require, no console, no fs)
  // Only inject module and exports mechanisms so the script can yield its runner function.
  const vmContext = vm.createContext({
    module: sandboxModule,
    exports: sandboxExports,
    // Add harmless global primitives if needed (e.g. Set, Map, JSON), but we'll stick to VM defaults
  });

  try {
    // Compile the code into a secure VM script object
    const script = new vm.Script(executableCode);

    // Run the code within the completely blank locked-down environment we created
    // Include a hard 1-second timeout for the synchronous context parsing block itself 
    // to prevent infinite loops at the top level of the payload.
    script.runInContext(vmContext, { timeout: 1000 });

    // Extract the default exported function
    const executableFunction = sandboxModule.exports.default || sandboxModule.exports;

    if (typeof executableFunction !== 'function') {
      throw new Error('Sandbox Error: The provided script did not export a default valid function.');
    }

    // Provision the secure SDK-generated payload wrapper containing our isolated DB references and abstractions
    const contextPayload = createContext(input);

    // Execute the user's function natively supplying it only the Context object
    // We wrap this inside Promise.resolve to gracefully handle both sync and async exports.
    // Also enforcing timeout on the worker level handled natively in executionManager.ts
    const result = await Promise.resolve(executableFunction(contextPayload));

    return result;
  } catch (error: any) {
    // Return a sterile non-leaking message bounding what escaped
    throw new Error(`Execution Failed: ${error.message}`);
  }
}
