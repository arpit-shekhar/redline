// Runs once when the server starts. Reports whether each key is set and
// never prints a value.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  for (const key of ["OPENROUTER_API_KEY"]) {
    console.log(`[redline] ${key}: ${process.env[key] ? "present" : "missing"}`);
  }
}
