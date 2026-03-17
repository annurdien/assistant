// This is the worker process that will execute the command script

process.on('message', async (message: { script: string; input: any }) => {
  try {
    const { script, input } = message;

    // Wrap the script in an async module so we can await it
    const wrappedScript = `
      return (async () => {
        ${script}
      })();
    `;

    // Create a new function from the script string
    // This allows the script to use 'input' as a variable
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const execute = new AsyncFunction('input', wrappedScript);

    // Execute the script with the provided input
    const result = await execute(input);

    // Send the result back to the parent process
    if (process.send) {
      process.send({ result });
    }
  } catch (error: any) {
    if (process.send) {
      process.send({ error: error.message || String(error) });
    }
  }
});
