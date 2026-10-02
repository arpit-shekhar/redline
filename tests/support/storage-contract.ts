import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { analyse } from "../../lib/analysis/analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../../lib/analysis/red-lines.ts";
import type { AnalysisResult } from "../../lib/analysis/types.ts";
import {
  openingOf,
  type DocumentStore,
  type NewDocument,
} from "../../lib/storage/types.ts";
import { loadFixture, type FixtureName } from "./fixtures.ts";
import { stubModel } from "./stub-model.ts";

// The storage contract: one set of tests that every kind of storage must
// pass. Each storage's test file calls documentStoreContract with a way to
// build a fresh store. The tests use only the DocumentStore interface.
//
// A store may already hold other documents (a real database may), so the
// tests only look at documents they saved themselves, and remove them at the
// end.

export type ContractSetup = {
  store: DocumentStore;
  // The person whose library the tests fill.
  userId: string;
  // Someone else, who must never see or delete that person's documents.
  otherUserId: string;
  // Called once at the end, for example to sign out.
  close?: () => Promise<void>;
};

export function documentStoreContract(
  name: string,
  setUp: () => Promise<ContractSetup>,
  // A reason to skip the whole run, for example missing settings. A skipped
  // run is reported as skipped, never as passed.
  skip?: string,
) {
  // Each test carries the skip, so the runner counts every one as skipped.
  const it = (title: string, fn: () => Promise<void>) => test(title, { skip }, fn);

  describe(name, () => {
    let setup: ContractSetup;
    let contract: NewDocument;
    let clean: NewDocument;
    const saved: string[] = [];

    const save = async (document: NewDocument) => {
      const id = await setup.store.save(setup.userId, document);
      saved.push(id);
      return id;
    };

    before(async () => {
      if (skip) return;
      setup = await setUp();
      // Two days apart, so "newest first" has one right answer.
      contract = await analysedFixture("adhesion-contract", new Date("2026-09-30T09:15:00Z"));
      clean = await analysedFixture("clean-document", new Date("2026-10-02T16:40:00Z"));
    });

    after(async () => {
      if (!setup) return;
      for (const id of saved) await setup.store.delete(setup.userId, id);
      await setup.close?.();
    });

    it("get returns the same text, type, analysis and date that were saved", async () => {
      const id = await save(contract);

      const document = await setup.store.get(setup.userId, id);

      assert.ok(document, "the saved document was not found");
      assert.equal(document.id, id);
      assert.equal(document.text, contract.text);
      assert.equal(document.documentType, contract.documentType);
      assert.deepEqual(document.analysis, contract.analysis);
      assert.equal(document.analysedAt.getTime(), contract.analysedAt.getTime());
    });

    it("the saved text still holds every flag's source sentence at its location", async () => {
      const id = await save(contract);
      const document = await setup.store.get(setup.userId, id);

      assert.ok(document && document.analysis.outcome === "flagged");
      for (const flag of document.analysis.flags) {
        const { start, end } = flag.sourceLocation;
        assert.equal(document.text.slice(start, end), flag.sourceSentence);
      }
    });

    it("list shows the newest analysis first, with its date and tab counts", async () => {
      // Saved oldest last, so the order cannot come from the order of saving.
      const newer = await save(clean);
      const older = await save(contract);

      const entries = (await setup.store.list(setup.userId)).filter((entry) =>
        [newer, older].includes(entry.id),
      );

      assert.deepEqual(
        entries.map((entry) => entry.id),
        [newer, older],
      );
      const [first, second] = entries;
      assert.equal(first.analysedAt.getTime(), clean.analysedAt.getTime());
      assert.equal(second.analysedAt.getTime(), contract.analysedAt.getTime());

      assert.equal(first.outcome, "clean");
      assert.equal(first.mustChange, 0);
      assert.equal(first.worthRaising, 0);
      assert.equal(first.documentType, clean.documentType);
      assert.equal(first.opening, openingOf(clean.text));

      assert.equal(second.outcome, "flagged");
      const flags = contract.analysis.outcome === "flagged" ? contract.analysis.flags : [];
      assert.equal(second.mustChange, flags.filter((f) => f.severity === "must-change").length);
      assert.equal(second.worthRaising, flags.filter((f) => f.severity === "worth-raising").length);
      assert.ok(second.mustChange > 0 && second.worthRaising > 0);
      assert.equal(second.opening, openingOf(contract.text));
    });

    it("list and get leave out documents that were never saved", async () => {
      assert.equal(await setup.store.get(setup.userId, randomUUID()), null);
      assert.equal(await setup.store.get(setup.userId, "not-an-id"), null);
      assert.equal(await setup.store.delete(setup.userId, randomUUID()), false);
    });

    it("delete removes the text and analysis, so get returns nothing", async () => {
      const id = await save(contract);

      assert.equal(await setup.store.delete(setup.userId, id), true);

      assert.equal(await setup.store.get(setup.userId, id), null);
      const ids = (await setup.store.list(setup.userId)).map((entry) => entry.id);
      assert.ok(!ids.includes(id), "the deleted document is still listed");
      // Deleting it again finds nothing.
      assert.equal(await setup.store.delete(setup.userId, id), false);
    });

    it("someone else cannot see or delete the document", async () => {
      const id = await save(contract);

      assert.equal(await setup.store.get(setup.otherUserId, id), null);
      const theirs = (await setup.store.list(setup.otherUserId)).map((entry) => entry.id);
      assert.ok(!theirs.includes(id), "the document shows in someone else's library");

      assert.equal(await setup.store.delete(setup.otherUserId, id), false);
      const still = await setup.store.get(setup.userId, id);
      assert.ok(still, "someone else's delete removed the document");
      assert.equal(still.text, contract.text);
    });
  });
}

// A test document with the analysis Analyse returns for it, using the stub
// model built from the document's answer key.
async function analysedFixture(name: FixtureName, analysedAt: Date): Promise<NewDocument> {
  const fixture = loadFixture(name);
  const outcome = await analyse(
    {
      text: fixture.text,
      documentType: fixture.sidecar.documentType,
      redLines: DEFAULT_RED_LINES,
      leverage: DEFAULT_LEVERAGE,
    },
    stubModel(fixture.sidecar),
    () => {},
  );
  assert.notEqual(outcome.outcome, "failed", `the analysis of ${name} failed`);
  return {
    documentType: fixture.sidecar.documentType,
    text: fixture.text,
    analysis: outcome as AnalysisResult,
    analysedAt,
  };
}
