import { FrappeResponseError } from "frappe-ui";
import { stripHtml } from "./text";

/**
 * A readable message for a failed frappe-ui call. `FrappeResponseError` messages read
 * `"<ExcType>: <message>"`; the type prefix is dropped, as the React app showed only the
 * server's message.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof FrappeResponseError) {
    const prefix = `${error.type}: `;
    const message = error.message.startsWith(prefix)
      ? error.message.slice(prefix.length)
      : error.title || error.message;
    return stripHtml(message);
  }
  if (error instanceof Error) return error.message;
  return String(error ?? "Something went wrong");
}
