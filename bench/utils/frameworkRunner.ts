const [, , benchName, frameworkName, portArg] = process.argv;

if (!benchName || !frameworkName || !portArg) {
  console.error(
    "Missing arguments. Usage: frameworkRunner <bench> <framework> <port>",
  );
  process.exit(1);
}

const port = Number(portArg);
if (!Number.isFinite(port)) {
  console.error(`Invalid port provided to frameworkRunner: ${portArg}`);
  process.exit(1);
}

const mod = await import(`../cases/${benchName}/${frameworkName}.ts`);
const bench = mod.default || mod;
const instance = bench.start(port);

async function shutdown(code = 0) {
  try {
    if (typeof instance?.stop === "function") {
      await instance.stop();
    }
  } catch (error) {
    console.error("Failed to stop framework cleanly", error);
  } finally {
    process.exit(code);
  }
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
process.on("uncaughtException", async (error) => {
  console.error(error);
  await shutdown(1);
});

export {};
