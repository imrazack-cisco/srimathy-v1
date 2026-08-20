import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { CircuitProvider } from "../ai/providers/circuit";

async function main() {
  console.log("\n================================");
  console.log("   SRIMATHY CIRCUIT TEST");
  console.log("================================\n");

  console.log("Provider :", CircuitProvider.name);

  console.log(
    "Model    :",
    process.env.CIRCUIT_MODEL ?? "NOT CONFIGURED"
  );

  console.log(
    "URL      :",
    process.env.CIRCUIT_URL
      ? "CONFIGURED"
      : "NOT CONFIGURED"
  );

  console.log(
    "API Key  :",
    process.env.CIRCUIT_API_KEY
      ? "CONFIGURED"
      : "NOT CONFIGURED"
  );

  console.log(
    "AppKey   :",
    process.env.CIRCUIT_APP_KEY
      ? "CONFIGURED"
      : "NOT CONFIGURED"
  );

  console.log("\nTesting...\n");

  try {
    const result = await CircuitProvider.generate(
      "You are a helpful educational AI assistant.",
      "Reply with exactly: CIRCUIT TEST PASSED"
    );

    console.log("✅ CIRCUIT RESPONSE:");
    console.log(result);

    console.log(
      "\nLatency:",
      CircuitProvider.lastMetrics?.latencyMs,
      "ms"
    );

    console.log("\n================================");
    console.log("            PASS");
    console.log("================================\n");

  } catch (error) {
    console.error("\n❌ CIRCUIT TEST FAILED\n");

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
}

main();