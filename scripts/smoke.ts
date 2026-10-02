// A live check of the whole analysis path: runs the test contract through the
// real Analyse with the real OpenRouter client and prints what comes back.
// It costs a real model call. It never falls back to a stub.
//
// Run with: npm run smoke

import { readFileSync } from "node:fs";
import { analyse } from "../lib/analysis/analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../lib/analysis/red-lines.ts";

const repo = new URL("../", import.meta.url);

// Load .env.local if there is one. Its values are never printed.
try {
  process.loadEnvFile(new URL(".env.local", repo));
} catch {
  // No .env.local here. The settings may already be in the environment.
}

const missing = ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].filter(
  (name) => !process.env[name]?.trim(),
);
if (missing.length > 0) {
  console.error(`Smoke check stopped. Missing: ${missing.join(", ")}.`);
  console.error("Set them in .env.local in the repo folder, then run it again.");
  process.exit(1);
}

const text = readFileSync(new URL("tests/fixtures/adhesion-contract.txt", repo), "utf8");

try {
  const analysis = await analyse({
    text,
    documentType: "contract",
    redLines: DEFAULT_RED_LINES,
    leverage: DEFAULT_LEVERAGE,
  });
  console.log("Summary\n");
  console.log(analysis.summary);
} catch (error) {
  console.error("Smoke check failed:");
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : error);
  process.exit(1);
}
