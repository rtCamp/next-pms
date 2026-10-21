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

/** The extensions `RichText` renders stored HTML with, by kit. */
export function kitExtensions(kit: RichTextKitName): Extensions {
  return kit === "richText" ? richTextExtensions() : [CommentKit];
}
