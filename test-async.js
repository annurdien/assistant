const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

const script = `
  async function fmt(n) {
    const currency = await Promise.resolve("IDR");
    return currency;
  }
  await fmt(10);
`;

const wrappedScript = `
  return (async () => {
    ${script}
  })();
`;

try {
  const execute = new AsyncFunction('input', wrappedScript);
  console.log("Success compiling");
} catch(e) {
  console.error("Compile error:", e);
}
