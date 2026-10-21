import type { ProjectDoc } from "@/pages/project-details/types";
import { hasProjectField } from "@/utils/boot";
import { EMPTY } from "./constants";

/** The Project fields the Overview tab shows and edits. */
export const OVERVIEW_FIELDS = [
  "custom_executive_summary",
  "custom_key_goals",
  "priority",
  "custom_complexity",
  "custom_key_account",
  "custom_host",
  "custom_source",
  "custom_territory",
  "custom_previous_cms",
  "custom_client_point_of_contact",
  "custom_time_report_frequency",
  "custom_restricted_under_nda",
  "custom_permission_for_case_study",
  "custom_permission_for_testimonial",
  "custom_testimonial_contact",
] as const satisfies readonly (keyof ProjectDoc)[];

export type OverviewField = (typeof OVERVIEW_FIELDS)[number];

/** Check fields, edited as Yes / No: `"1"`, `"0"`, or `""` when unset. */
export const CHECK_FIELDS = [
  "custom_restricted_under_nda",
  "custom_permission_for_case_study",
  "custom_permission_for_testimonial",
] as const satisfies readonly OverviewField[];

/** Fields that come from other apps; shown and saved only when the site has them. */
export const OPTIONAL_FIELDS: readonly OverviewField[] = [
  "custom_source",
  "custom_territory",
  "custom_previous_cms",
  ...CHECK_FIELDS,
];

/** Fields holding editor HTML. */
export const RICH_TEXT_FIELDS = [
  "custom_executive_summary",
  "custom_key_goals",
] as const satisfies readonly OverviewField[];

/** The Overview's values as the editors hold them: every field a string. */
export type OverviewDraft = Record<OverviewField, string>;

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (char) => ESCAPES[char]!);
}

/**
 * Editor HTML for a rich-text value. Text typed in Desk has no tags; it becomes
 * paragraphs (at blank lines) with line breaks, so its lines survive.
 */
export function toEditorHtml(value: string): string {
  if (!value.trim() || /<[a-z][^>]*>/i.test(value)) return value;
  return value
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/** The Project's Overview values, as the editors hold them. */
export function toDraft(doc: ProjectDoc): OverviewDraft {
  const draft = {} as OverviewDraft;
  for (const field of OVERVIEW_FIELDS) {
    const value = doc[field];
    draft[field] = value === null || value === undefined ? "" : String(value);
  }
  for (const field of RICH_TEXT_FIELDS) {
    draft[field] = toEditorHtml(draft[field]);
  }
  return draft;
}

/** How a Check field reads: Yes, No, or the empty dash when unset. */
export function yesNoLabel(value: string): string {
  if (value === "1") return "Yes";
  if (value === "0") return "No";
  return EMPTY;
}

// The editor writes an emptied field as an empty paragraph.
function isEmptyHtml(html: string) {
  return html.replace(/<p>(<br\s*\/?>)?<\/p>/g, "").trim() === "";
}

function sameValue(field: OverviewField, a: string, b: string) {
  if (a === b) return true;
  return (
    (RICH_TEXT_FIELDS as readonly OverviewField[]).includes(field) &&
    isEmptyHtml(a) &&
    isEmptyHtml(b)
  );
}

/**
 * The fields the draft changes on `doc`, as Project values to save: Checks as 0 / 1,
 * the rest as strings. Optional fields the site lacks are left out.
 */
export function changedFields(
  draft: OverviewDraft,
  doc: ProjectDoc,
  hasField: (fieldname: string) => boolean = hasProjectField,
): Partial<ProjectDoc> {
  const saved = toDraft(doc);
  const changes: Record<string, string | number> = {};
  for (const field of OVERVIEW_FIELDS) {
    if (OPTIONAL_FIELDS.includes(field) && !hasField(field)) continue;
    if (sameValue(field, draft[field], saved[field])) continue;
    changes[field] = (CHECK_FIELDS as readonly OverviewField[]).includes(field)
      ? Number(draft[field] === "1")
      : draft[field];
  }
  return changes as Partial<ProjectDoc>;
}
