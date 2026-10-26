/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

export const NOTES_HELP = {
  templates: {
    title: "Templates",
    summary:
      "Saved templates are shared across all projects, not tied to this one.",
    details: [
      "Anyone who can see notes can edit or delete any template, and the change shows on every project.",
      "Notes started from a template keep their text when the template changes or is deleted.",
    ],
    wiki: "Project-Detail#behaviour--states-4",
  },
} satisfies Record<string, FieldHelp>;

export const SUBSCRIBE_TOOLTIP =
  "Subscribers get a notification and an email when someone else posts a new note on this project.";

export const ACCOUNT_MANAGER_SUBSCRIBED_TOOLTIP =
  "You're this project's Account Manager, so you get a notification and an email whenever someone else posts a new note.";

export const PIN_TOOLTIP =
  "Pinned notes stay at the top of the Notes tab for everyone on this project.";

export const UNPIN_TOOLTIP =
  "Pinned for everyone on this project. Select to unpin.";

export const DELETE_NOTE_TOOLTIP = (author: string) =>
  `Only ${author} can delete this note.`;
