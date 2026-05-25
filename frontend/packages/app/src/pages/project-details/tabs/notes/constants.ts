import type { FilterField } from "@rtcamp/frappe-ui-react";
import { NOTE_AUTHORS } from "./fake-data";

export const FILTER_FIELDS: FilterField[] = [
  {
    name: "author",
    label: "Author",
    type: "select",
    options: NOTE_AUTHORS.map((a) => ({ label: a.name, value: a.email })),
  },
  {
    name: "createdAt",
    label: "Creation date",
    type: "daterange",
  },
];

export const CREATE_OPTIONS = {
  newFromTemplate: "new-from-template",
  newBlankNote: "new-blank-note",
} as const;
