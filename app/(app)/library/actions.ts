"use server";

import { redirect } from "next/navigation";
import { openLibrary } from "@/lib/storage/session.ts";

// Deletes one document from the signed-in reader's library: its text and its
// analysis together. The page asks the reader to confirm first.
export async function deleteSavedDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const library = await openLibrary();
  if (library.status !== "ready") redirect("/library");

  let deleted: boolean;
  try {
    deleted = await library.documents.delete(library.userId, id);
  } catch (error) {
    console.error(
      "[redline] Could not delete from the library:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    redirect(`/library/${encodeURIComponent(id)}?delete=failed`);
  }
  // Nothing of this reader's had that id, so there was nothing to delete.
  redirect(deleted ? "/library?deleted" : "/library");
}
