import type { SupabaseClient } from "@supabase/supabase-js";
import {
  openingOf,
  readAnalysis,
  readDocumentType,
  StorageError,
  tabCounts,
  type DocumentStore,
  type LibraryEntry,
  type NewDocument,
  type SavedDocument,
  type Storage,
} from "./types.ts";

// Storage in the Supabase database. The tables and their access rules are in
// supabase/migrations/. The client passed in carries the signed-in person's
// session, and the database's row level security (rules checked by the
// database on every row) lets that person read, add and delete only their
// own rows. Every query here also names the user id, so a wrong id finds
// nothing rather than relying on those rules alone.

const TABLE = "documents";

// Postgres rejects an id that is not a UUID (a 36-character id such as
// 2f1c...-...). Such an id cannot match a row, so it is answered without a
// query.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DocumentRow = {
  id: string;
  document_type: string;
  opening: string;
  text: string;
  analysis: unknown;
  analysed_at: string;
};

export function createSupabaseStorage(client: SupabaseClient): Storage {
  const documents: DocumentStore = {
    async save(userId: string, document: NewDocument) {
      const { data, error } = await client
        .from(TABLE)
        .insert({
          user_id: userId,
          document_type: document.documentType,
          opening: openingOf(document.text),
          text: document.text,
          analysis: document.analysis,
          analysed_at: document.analysedAt.toISOString(),
        })
        .select("id")
        .single();
      if (error || !data) throw failure("save the document", error);
      return String(data.id);
    },

    async list(userId: string) {
      // The analysis is read only to count tabs. The text is left behind.
      const { data, error } = await client
        .from(TABLE)
        .select("id, document_type, opening, analysis, analysed_at")
        .eq("user_id", userId)
        .order("analysed_at", { ascending: false });
      if (error || !data) throw failure("list the documents", error);
      return (data as Omit<DocumentRow, "text">[]).map((row): LibraryEntry => {
        const analysis = readAnalysis(row.analysis);
        return {
          id: row.id,
          documentType: readDocumentType(row.document_type),
          opening: row.opening,
          analysedAt: new Date(row.analysed_at),
          outcome: analysis.outcome,
          ...tabCounts(analysis),
        };
      });
    },

    async get(userId: string, id: string) {
      if (!UUID.test(id)) return null;
      const { data, error } = await client
        .from(TABLE)
        .select("id, document_type, opening, text, analysis, analysed_at")
        .eq("user_id", userId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw failure("open the document", error);
      if (!data) return null;
      const row = data as DocumentRow;
      const document: SavedDocument = {
        id: row.id,
        documentType: readDocumentType(row.document_type),
        text: row.text,
        analysis: readAnalysis(row.analysis),
        analysedAt: new Date(row.analysed_at),
      };
      return document;
    },

    async delete(userId: string, id: string) {
      if (!UUID.test(id)) return false;
      // Asking for the deleted ids back shows whether a row was removed.
      const { data, error } = await client
        .from(TABLE)
        .delete()
        .eq("user_id", userId)
        .eq("id", id)
        .select("id");
      if (error || !data) throw failure("delete the document", error);
      return data.length > 0;
    },
  };

  return { documents };
}

// The database's own message names columns and codes, never row contents,
// so it is safe for the server log.
function failure(action: string, error: { message?: string } | null): StorageError {
  const detail = error?.message ? `: ${error.message}` : "";
  return new StorageError(`Could not ${action}${detail}`);
}
