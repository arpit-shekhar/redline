import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { analyse } from "../../lib/analysis/analyse.ts";
import {
  addOwnRedLine,
  DEFAULT_LEVERAGE,
  DEFAULT_RED_LINES,
  DEFAULT_SETTINGS,
  redLinesToCheck,
  removeOwnRedLine,
  setDefaultSeverity,
  setLeverage,
  switchDefault,
  type Change,
  type RedLineSettings,
} from "../../lib/analysis/red-lines.ts";
import type { AnalysisResult } from "../../lib/analysis/types.ts";
import {
  openingOf,
  type DocumentStore,
  type NewDocument,
  type RedLineStore,
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

// ---------------------------------------------------------------------------
// Red lines and leverage

export type RedLineContractSetup = {
  store: RedLineStore;
  // The person whose red lines the tests set.
  userId: string;
  // Someone else, who must never see that person's red lines.
  otherUserId: string;
  close?: () => Promise<void>;
};

// The same contract for red lines and leverage. A real database may already
// hold the test account's red lines, so they are read first and put back at
// the end.
export function redLineStoreContract(
  name: string,
  setUp: () => Promise<RedLineContractSetup>,
  skip?: string,
) {
  const it = (title: string, fn: () => Promise<void>) => test(title, { skip }, fn);

  describe(name, () => {
    let setup: RedLineContractSetup;
    let existing: RedLineSettings | null = null;

    // Settings with every kind of change the red lines page makes.
    const edited = (): RedLineSettings => {
      let settings = DEFAULT_SETTINGS;
      settings = ok(switchDefault(settings, "Non-competes", false));
      settings = ok(setDefaultSeverity(settings, "Automatic renewal", "worth-raising"));
      settings = ok(setDefaultSeverity(settings, "Late fees and penalties", "must-change"));
      settings = ok(addOwnRedLine(settings, "No price rises when the contract renews", "must-change", randomUUID()));
      settings = ok(addOwnRedLine(settings, "Payment within 30 days of each invoice", "worth-raising", randomUUID()));
      settings = ok(setLeverage(settings, "cannot-walk-away"));
      return settings;
    };

    before(async () => {
      if (skip) return;
      setup = await setUp();
      existing = await setup.store.get(setup.userId);
    });

    after(async () => {
      if (!setup) return;
      // Put back what was there. A test account that had none keeps the
      // defaults, which is what it would have been given anyway.
      await setup.store.save(setup.userId, existing ?? DEFAULT_SETTINGS);
      await setup.close?.();
    });

    it("someone who has saved nothing gets nothing back", async () => {
      assert.equal(await setup.store.get(randomUUID()), null);
    });

    it("get returns the red lines and leverage that were saved", async () => {
      const settings = edited();
      await setup.store.save(setup.userId, settings);

      assert.deepEqual(await setup.store.get(setup.userId), settings);
    });

    it("a second save replaces the first, and is still there when read again", async () => {
      const first = edited();
      await setup.store.save(setup.userId, first);

      let second = ok(removeOwnRedLine(first, first.own[0].id));
      second = ok(switchDefault(second, "Non-competes", true));
      second = ok(setLeverage(second, "can-walk-away"));
      await setup.store.save(setup.userId, second);

      assert.deepEqual(await setup.store.get(setup.userId), second);
      // Read again, as the next document would.
      assert.deepEqual(await setup.store.get(setup.userId), second);
    });

    it("unanswered leverage is kept as unanswered", async () => {
      const settings = { ...edited(), leverage: null };
      await setup.store.save(setup.userId, settings);

      assert.equal((await setup.store.get(setup.userId))?.leverage, null);
    });

    it("someone else cannot see the red lines", async () => {
      await setup.store.save(setup.userId, edited());

      assert.equal(await setup.store.get(setup.otherUserId), null);
    });

    it("saved red lines drive the next analysis", async () => {
      await setup.store.save(setup.userId, edited());
      const saved = await setup.store.get(setup.userId);
      assert.ok(saved);

      const fixture = loadFixture("adhesion-contract");
      const result = await analyse(
        {
          text: fixture.text,
          documentType: fixture.sidecar.documentType,
          redLines: redLinesToCheck(saved),
          leverage: saved.leverage,
        },
        stubModel(fixture.sidecar),
        () => {},
      );

      assert.equal(result.outcome, "flagged");
      if (result.outcome !== "flagged") return;
      assert.ok(!result.checkedFor.includes("Non-competes"));
      assert.ok(result.checkedFor.includes("No price rises when the contract renews"));
      const renewal = result.flags.find((f) => f.clauseType === "Automatic renewal");
      assert.equal(renewal?.severity, "worth-raising");
    });
  });
}

function ok(change: Change): RedLineSettings {
  assert.ok(change.ok, change.ok ? "" : change.problem);
  return change.settings;
}

// A test document with the analysis Analyse returns for it, using the stub
// model built from the document's answer key.
export async function analysedFixture(name: FixtureName, analysedAt: Date): Promise<NewDocument> {
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
