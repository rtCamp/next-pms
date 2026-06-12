/**
 * External dependencies.
 */
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import type { Note } from "../types";

const FILENAME_TITLE_CAP = 50;

/**
 * Exports the note content as a text file.
 */
export function exportNote(note: Note) {
  const safeTitle =
    note.title
      .slice(0, FILENAME_TITLE_CAP)
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "note";
  const filename = `${safeTitle}-${format(new Date(), "yyyy-MM-dd-HHmmss")}.txt`;
  const url = URL.createObjectURL(
    new Blob([note.description], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
