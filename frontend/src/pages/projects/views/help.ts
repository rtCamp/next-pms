import type { FieldHelp } from "@/components/InfoHoverCard";

export const PUBLIC_VIEW_HELP: FieldHelp = {
  title: "Public view",
  summary:
    "Lets everyone who can open Projects pick this view from the view menu at the top of the page.",
  details: [
    "Only you and the Administrator can edit or delete it.",
    "Others can duplicate it to get their own private copy.",
  ],
  wiki: "Saved-Views#share-a-view-with-the-whole-team",
};
