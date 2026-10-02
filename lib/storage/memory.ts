import { randomUUID } from "node:crypto";
import {
  entryFor,
  type DocumentStore,
  type NewDocument,
  type SavedDocument,
  type Storage,
} from "./types.ts";

// Storage kept in this process's memory. It is lost when the process ends.
// Tests and the smoke check use it. The product does not: the product only
// keeps a library for someone who has signed in, and that needs Supabase.

type Row = SavedDocument & { userId: string };

export function createMemoryStorage(): Storage {
  // Rows in the order they were saved.
  const rows: Row[] = [];

  const documents: DocumentStore = {
    async save(userId: string, document: NewDocument) {
      const id = randomUUID();
      rows.push({ ...copy(document), id, userId });
      return id;
    },

    async list(userId: string) {
      return rows
        .filter((row) => row.userId === userId)
        .map((row, order) => ({ row, order }))
        // Newest analysis first. Two analyses with the same time keep the
        // later save first.
        .sort(
          (a, b) =>
            b.row.analysedAt.getTime() - a.row.analysedAt.getTime() || b.order - a.order,
        )
        .map(({ row }) => entryFor(withoutOwner(row)));
    },

    async get(userId: string, id: string) {
      const row = rows.find((r) => r.id === id && r.userId === userId);
      return row ? withoutOwner(row) : null;
    },

    async delete(userId: string, id: string) {
      const index = rows.findIndex((r) => r.id === id && r.userId === userId);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };

  return { documents };
}

// Copies go in and out, so a caller changing an object it holds cannot change
// what is stored.
function copy<T>(value: T): T {
  return structuredClone(value);
}

function withoutOwner(row: Row): SavedDocument {
  const { id, documentType, text, analysis, analysedAt } = row;
  return copy({ id, documentType, text, analysis, analysedAt });
}
