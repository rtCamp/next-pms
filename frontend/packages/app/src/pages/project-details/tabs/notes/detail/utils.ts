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
 * Download the note as a .txt file. The body is written as raw HTML (per the
 * dev-team decision — no tag stripping); the filename is the length-capped,
 * sanitised title plus a timestamp.
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
  // Defer revoke so the browser has started reading the blob; revoking
  // synchronously after click() can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
