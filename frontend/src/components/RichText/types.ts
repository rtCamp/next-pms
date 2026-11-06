/**
 * The editor kit the content was written with: `"comment"` for comments, notes and
 * status updates (frappe-ui's CommentKit), `"richText"` for long-form fields with
 * tables, task lists and highlights (see `richTextExtensions()`).
 */
export type RichTextKitName = "comment" | "richText";

export interface RichTextProps {
  /** HTML written with the editor, e.g. a comment's content. */
  content: string;
  /** The kit the content was written with. Default: `"comment"`. */
  kit?: RichTextKitName;
}
