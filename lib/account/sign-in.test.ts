import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_PASSWORD_LENGTH, problemFor, readCredentials, safeNext } from "./sign-in.ts";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

test("a usable email and password come back as typed, with the email trimmed", () => {
  const password = " a password with spaces ";
  assert.deepEqual(readCredentials(form({ email: "  reader@example.com ", password }), "sign-in"), {
    ok: true,
    email: "reader@example.com",
    password,
  });
});

test("a missing or malformed email is refused before the sign-in service is asked", () => {
  for (const email of ["", "   ", "reader", "reader@example", "two words@example.com"]) {
    const result = readCredentials(form({ email, password: "long enough password" }), "sign-in");
    assert.equal(result.ok, false, `accepted ${JSON.stringify(email)}`);
  }
});

test("a refused form keeps the email the reader typed", () => {
  const result = readCredentials(form({ email: "reader@example.com", password: "" }), "sign-in");
  assert.deepEqual(result, {
    ok: false,
    problem: "Enter your password.",
    email: "reader@example.com",
  });
});

test("a short password is refused for a new account but not for signing in", () => {
  const short = "x".repeat(MIN_PASSWORD_LENGTH - 1);
  const fields = { email: "reader@example.com", password: short };

  const signUp = readCredentials(form(fields), "sign-up");
  assert.equal(signUp.ok, false);
  assert.match(signUp.ok ? "" : signUp.problem, new RegExp(`${MIN_PASSWORD_LENGTH} characters`));

  // An older account may have a shorter password, so signing in still tries.
  assert.equal(readCredentials(form(fields), "sign-in").ok, true);
  assert.equal(
    readCredentials(form({ ...fields, password: "x".repeat(MIN_PASSWORD_LENGTH) }), "sign-up").ok,
    true,
  );
});

test("each refusal from the sign-in service gets its own plain line", () => {
  const wrongPassword = problemFor({ code: "invalid_credentials" }, "sign-in");
  const unconfirmed = problemFor({ code: "email_not_confirmed" }, "sign-in");
  const taken = problemFor({ code: "user_already_exists" }, "sign-up");
  const unreachable = problemFor({ unreachable: true }, "sign-in");

  assert.equal(new Set([wrongPassword, unconfirmed, taken, unreachable]).size, 4);
  assert.match(wrongPassword, /do not match/);
  assert.match(unconfirmed, /confirm your email/);
  assert.match(taken, /already an account/);
  assert.match(unreachable, /could not reach/);
});

test("a refusal Redline does not know gets a general line for what was being tried", () => {
  assert.match(problemFor({ code: "something_new" }, "sign-in"), /could not sign you in/);
  assert.match(problemFor({}, "sign-up"), /could not make your account/);
});

test("after signing in, the reader goes only to one of Redline's own pages", () => {
  assert.equal(safeNext("/red-lines"), "/red-lines");
  assert.equal(safeNext("/try"), "/try");
  for (const value of [null, undefined, "", "/elsewhere", "https://example.com/", "//example.com/library"]) {
    assert.equal(safeNext(value), "/library", `followed ${JSON.stringify(value)}`);
  }
});
