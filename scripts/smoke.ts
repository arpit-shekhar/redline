// A live check of the whole analysis path: runs a test document through the
// real Analyse with the real OpenRouter client and prints what comes back:
// which outcome (flagged, clean, withheld or failed), the summary, every flag
// that passed the checks, and how many were held back. It costs a real model
// call. It never falls back to a stub.
//
// Run with: npm run smoke
// Or, for the document with nothing planted: npm run smoke -- clean-document

import { readFileSync } from "node:fs";
import { analyse } from "../lib/analysis/analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../lib/analysis/red-lines.ts";

const repo = new URL("../", import.meta.url);

const FIXTURES = ["adhesion-contract", "clean-document"];
const fixture = process.argv[2] ?? "adhesion-contract";
if (!FIXTURES.includes(fixture)) {
  console.error(`Unknown test document "${fixture}". Use one of: ${FIXTURES.join(", ")}.`);
  process.exit(1);
}

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

const text = readFileSync(new URL(`tests/fixtures/${fixture}.txt`, repo), "utf8");

// Analyse reports a failure as an outcome rather than throwing, so the catch
// below only sees a mistake in the call itself, such as every red line off.
try {
  const result = await analyse({
    text,
    documentType: fixture === "clean-document" ? "freelance-agreement" : "contract",
    redLines: DEFAULT_RED_LINES,
    leverage: DEFAULT_LEVERAGE,
  });
  console.log(`Document: ${fixture}`);
  console.log(`Outcome: ${result.outcome}\n`);

  if (result.outcome === "failed") {
    console.error("The analysis failed, so nothing from it is shown.");
    console.error(result.reason);
    // Setting the exit code, rather than exiting at once, lets Node close its
    // network connections first. Exiting while they close crashes Node on
    // Windows.
    process.exitCode = 1;
  } else {
    console.log("Summary\n");
    console.log(result.summary);
  }

  if (result.outcome === "flagged") {
    console.log(`\nFlags (${result.flags.length})\n`);
    result.flags.forEach((flag, index) => {
      console.log(`${index + 1}. ${flag.severity} | ${flag.clauseType}`);
      console.log(`   "${flag.sourceSentence.replace(/\s+/g, " ")}"`);
    });
    console.log(`\nHeld back because they failed the checks: ${result.dropped}`);
  }

  if (result.outcome === "clean") {
    console.log(`\n${result.statement}`);
    console.log("Checked for and not found:");
    for (const clauseType of result.checkedFor) console.log(`- ${clauseType}`);
  }

  if (result.outcome === "withheld") {
    console.log(
      `\nEvery flag failed the checks. Held back: ${result.withheld}. This is not a clean result.`,
    );
  }
} catch (error) {
  console.error("Smoke check failed:");
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : error);
  process.exitCode = 1;
}
