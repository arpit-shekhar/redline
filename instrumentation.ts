import { chooseStorage, describeStorage } from "./lib/storage/choose.ts";

// Runs once when the server starts. Reports whether each model setting is
// present or missing, and which storage the app uses. It never prints a
// value.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  for (const name of ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"]) {
    console.log(`[redline] ${name}: ${process.env[name] ? "present" : "missing"}`);
  }
  console.log(`[redline] ${describeStorage(chooseStorage())}`);
}
