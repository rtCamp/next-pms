import type { FieldHelp } from "@/components/InfoHoverCard";

export const ACTIVITY_HELP: FieldHelp = {
  title: "Activity",
  summary:
    "A history of this record: who created it, who last edited it and which values changed.",
  details: [
    'A line like "added 2 rows in" followed by a name means rows were added, removed or changed in that table of the record.',
    "Impersonated by means someone else made the change while signed in as the user named at the start of the line.",
    "Only the 50 most recent changes are listed.",
  ],
};
