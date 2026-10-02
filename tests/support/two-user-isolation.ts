import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addOwnRedLine,
  DEFAULT_SETTINGS,
  setLeverage,
  type Change,
  type RedLineSettings,
} from "../../lib/analysis/red-lines.ts";
import type { Storage } from "../../lib/storage/types.ts";
import { analysedFixture } from "./storage-contract.ts";

// Two real people signed in to the real database. Person A keeps a document
// and red lines. Person B then tries to read, change and delete them, both
// through Redline's storage (passing A's user id, as a bug in the app might)
// and straight against the tables, as anyone holding B's session could. The
// database must refuse every one, so these tests check the database's own
// rules (row level security), not only Redline's code.

export type SignedInPerson = {
  client: SupabaseClient;
  storage: Storage;
  userId: string;
  close: () => Promise<void>;
};

export function twoUserIsolation(
  name: string,
  signInA: () => Promise<SignedInPerson>,
  signInB: () => Promise<SignedInPerson>,
  // A reason to skip, for example missing settings. A skipped run is
  // reported as skipped, never as passed.
  skip?: string,
) {
  const it = (title: string, fn: () => Promise<void>) => test(title, { skip }, fn);

  describe(name, () => {
    let a: SignedInPerson;
    let b: SignedInPerson;
    let documentId: string;
    let textOfA: string;
    let redLinesOfA: RedLineSettings;
    // A's red lines from before the run, put back at the end.
    let earlierRedLinesOfA: RedLineSettings | null = null;

    before(async () => {
      if (skip) return;
      a = await signInA();
      b = await signInB();
      assert.notEqual(a.userId, b.userId, "The two test accounts must belong to different people.");

      earlierRedLinesOfA = await a.storage.redLines.get(a.userId);
      const document = await analysedFixture("adhesion-contract", new Date());
      textOfA = document.text;
      documentId = await a.storage.documents.save(a.userId, document);

      redLinesOfA = ok(
        setLeverage(
          ok(addOwnRedLine(DEFAULT_SETTINGS, "No price rises when the contract renews", "must-change", randomUUID())),
          "can-walk-away",
        ),
      );
      await a.storage.redLines.save(a.userId, redLinesOfA);
    });

    after(async () => {
      if (!a) return;
      await a.storage.documents.delete(a.userId, documentId);
      if (earlierRedLinesOfA) {
        await a.storage.redLines.save(a.userId, earlierRedLinesOfA);
      } else {
        await a.client.from("red_lines").delete().eq("user_id", a.userId);
      }
      await a.close();
      await b?.close();
    });

    it("B cannot read A's document, through Redline or straight from the table", async () => {
      assert.equal(await b.storage.documents.get(a.userId, documentId), null);
      const listed = await b.storage.documents.list(a.userId);
      assert.ok(!listed.some((entry) => entry.id === documentId));

      const { data, error } = await b.client.from("documents").select("id, text").eq("id", documentId);
      assert.equal(error, null);
      assert.deepEqual(data, []);
    });

    it("B cannot change A's document", async () => {
      const { data, error } = await b.client
        .from("documents")
        .update({ text: "Changed by someone else." })
        .eq("id", documentId)
        .select("id");
      // Refused outright, or allowed to touch nothing.
      assert.ok(error !== null || data?.length === 0, "the database let B change A's document");

      const kept = await a.storage.documents.get(a.userId, documentId);
      assert.equal(kept?.text, textOfA);
    });

    it("B cannot delete A's document", async () => {
      assert.equal(await b.storage.documents.delete(a.userId, documentId), false);
      const { data, error } = await b.client
        .from("documents")
        .delete()
        .eq("id", documentId)
        .select("id");
      assert.ok(error !== null || data?.length === 0, "the database let B delete A's document");

      assert.notEqual(await a.storage.documents.get(a.userId, documentId), null);
    });

    it("B cannot put a document in A's library", async () => {
      const { error } = await b.client.from("documents").insert({
        user_id: a.userId,
        document_type: "contract",
        text: "Written by someone else.",
        analysis: { outcome: "clean", summary: "Written by someone else." },
      });
      assert.notEqual(error, null, "the database let B add to A's library");
      const listed = await a.storage.documents.list(a.userId);
      assert.ok(!listed.some((entry) => entry.opening === "Written by someone else."));
    });

    it("B cannot read A's red lines or leverage", async () => {
      assert.equal(await b.storage.redLines.get(a.userId), null);
      const { data, error } = await b.client
        .from("red_lines")
        .select("defaults, own, leverage")
        .eq("user_id", a.userId);
      assert.equal(error, null);
      assert.deepEqual(data, []);
    });

    it("B cannot change A's red lines or leverage", async () => {
      await assert.rejects(b.storage.redLines.save(a.userId, DEFAULT_SETTINGS));
      const { data, error } = await b.client
        .from("red_lines")
        .update({ leverage: "cannot-walk-away", own: [] })
        .eq("user_id", a.userId)
        .select("user_id");
      assert.ok(error !== null || data?.length === 0, "the database let B change A's red lines");

      assert.deepEqual(await a.storage.redLines.get(a.userId), redLinesOfA);
    });

    it("B cannot delete A's red lines or leverage", async () => {
      const { data, error } = await b.client
        .from("red_lines")
        .delete()
        .eq("user_id", a.userId)
        .select("user_id");
      assert.ok(error !== null || data?.length === 0, "the database let B delete A's red lines");

      assert.deepEqual(await a.storage.redLines.get(a.userId), redLinesOfA);
    });

    it("when A deletes the document, its text is gone from the table, not only from the list", async () => {
      assert.equal(await a.storage.documents.delete(a.userId, documentId), true);
      const { data, error } = await a.client.from("documents").select("id, text").eq("id", documentId);
      assert.equal(error, null);
      assert.deepEqual(data, []);
      assert.equal(await a.storage.documents.get(a.userId, documentId), null);
    });
  });
}

function ok(change: Change): RedLineSettings {
  assert.ok(change.ok, change.ok ? "" : change.problem);
  return change.settings;
}
