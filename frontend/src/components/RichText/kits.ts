import type { Extensions } from "@tiptap/core";
import { CommentKit, RichTextKit } from "frappe-ui/editor";
import type { RichTextKitName } from "./types";

/**
 * The rich-text editor's extensions, matching the React app's text editor:
 * tables, task lists, text alignment, text colour and highlight, code blocks.
 * No media, mentions, tags, emoji or slash menu, as there. Built per editor.
 */
export function richTextExtensions(): Extensions {
  return [
    RichTextKit.configure({
      image: false,
      video: false,
      attachment: false,
      iframe: false,
      mention: false,
      tag: false,
      emoji: false,
      slashCommands: false,
      typography: false,
      contentPaste: false,
    }),
  ];
}

/**
 * Undoes frappe-ui's editor styles React's editor lacks: highlights hug the
 * words in dark text, and task-list checkboxes are the browser's own. `&&`
 * outranks frappe-ui's `.ProseMirror mark`, which loads after our CSS.
 */
export const RICH_TEXT_KIT_CLASS =
  // eslint-disable-next-line better-tailwindcss/no-restricted-classes -- the stored HTML's marks and checkboxes take no props or slots
  "[&&_mark]:rounded-none [&&_mark]:p-0 [&&_mark]:text-ink-gray-9 [&_[type=checkbox]]:appearance-auto [&_[type=checkbox]]:rounded-none [&_[type=checkbox]]:accent-current";

/** The extensions `RichText` renders stored HTML with, by kit. */
export function kitExtensions(kit: RichTextKitName): Extensions {
  return kit === "richText" ? richTextExtensions() : [CommentKit];
}
