import { dayjs } from "frappe-ui";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { stripTags } from "@/utils/text";
import {
  PUBLISH_STATUS,
  TEMPLATE_DESCRIPTION_MAX_LENGTH,
  TEMPLATE_DOCTYPE,
} from "./constants";
import type {
  FormErrors,
  Note,
  NoteFilters,
  NoteForm,
  NoteRow,
  NoteTemplate,
  NoteUser,
  TemplateForm,
} from "./types";

type Filter = [string, string, unknown];

/** The project's published notes, as `get_list` filters. */
export function publishedFilters(projectId: string): Filter[] {
  return [
    ["project", "=", projectId],
    ["status", "=", PUBLISH_STATUS],
  ];
}

/** The list's filters: the project's published notes, narrowed by the search and author. */
export function noteListFilters(
  projectId: string,
  filters: NoteFilters,
): Filter[] {
  const title = filters.title.trim();
  const description = filters.description.trim();
  return [
    ...publishedFilters(projectId),
    ...(filters.author ? [["owner", "=", filters.author] as Filter] : []),
    ...(title ? [["title", "like", `%${title}%`] as Filter] : []),
    ...(description
      ? [["description", "like", `%${description}%`] as Filter]
      : []),
  ];
}

/** The distinct authors of the given notes, in order. */
export function authorIds(rows: { owner: string }[]): string[] {
  return [...new Set(rows.map((row) => row.owner).filter(Boolean))];
}

/** The list's rows with their authors' names and images. */
export function toNotes(rows: NoteRow[], users: NoteUser[]): Note[] {
  const byId = new Map(users.map((user) => [user.name, user]));
  return rows.map((row) => {
    const user = byId.get(row.owner);
    return {
      ...row,
      pinned: Boolean(row.pinned),
      ownerName: user?.full_name?.trim() ?? "",
      ownerImage: user?.user_image || null,
    };
  });
}

/** The author filter's options: All, then each author whose name is known. */
export function authorOptions(
  ids: string[],
  users: NoteUser[],
): { label: string; value: string }[] {
  const byId = new Map(users.map((user) => [user.name, user]));
  return [
    { label: "All", value: "" },
    ...ids
      .map((id) => ({
        label: byId.get(id)?.full_name?.trim() ?? "",
        value: id,
      }))
      .filter((option) => option.label),
  ];
}

const FILE_TITLE_LENGTH = 50;

/** An exported note's file name: the title's slug and the export time. */
export function exportFileName(title: string, now: Date): string {
  const slug =
    title
      .slice(0, FILE_TITLE_LENGTH)
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "note";
  return `${slug}-${dayjs(now).format("YYYY-MM-DD-HHmmss")}.txt`;
}

/** Downloads the note's stored HTML as a `.txt` file, as React does. */
export function exportNote(note: Pick<Note, "title" | "description">) {
  const url = URL.createObjectURL(
    new Blob([note.description], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFileName(note.title, new Date());
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** The template picker's `get_list` filters: one category, and a search of the name and title. */
export function templateListFilters(query: string, category: string | null) {
  const search = query.trim();
  return {
    filters: category
      ? [[TEMPLATE_DOCTYPE, "category", "=", category]]
      : undefined,
    or_filters: search
      ? [
          [TEMPLATE_DOCTYPE, "template_name", "like", `%${search}%`],
          [TEMPLATE_DOCTYPE, "title", "like", `%${search}%`],
        ]
      : undefined,
  };
}

/** A template's line in the picker: its description, else its body as text. */
export function templateSummary(template: NoteTemplate): string {
  return template.template_description || stripTags(template.description);
}

/** The title and body a note or template starts with: the template's when there is one. */
export function initialNoteForm(
  note: Pick<NoteRow, "title" | "description"> | null,
  template: NoteTemplate | null,
): NoteForm {
  return {
    title: note?.title || template?.title || template?.template_name || "",
    description: note?.description || template?.description || "",
  };
}

/** The category options, plus the typed text as a new category when no category matches it. */
export function categoryOptions(
  existing: LookupOption[],
  query: string,
): LookupOption[] {
  const typed = query.trim();
  const known = existing.some(
    (option) => option.label.toLowerCase() === typed.toLowerCase(),
  );
  if (!typed || known) return existing;
  return [
    ...existing,
    { label: typed, value: typed, description: "New category" },
  ];
}

/** Whether the body has visible text. */
export function hasBody(html: string): boolean {
  return stripTags(html) !== "";
}

export function noteFormErrors(form: NoteForm): FormErrors<NoteForm> {
  return {
    ...(!form.title.trim() && { title: "Title is required" }),
    ...(!hasBody(form.description) && {
      description: "Description is required",
    }),
  };
}

export function templateFormErrors(
  form: TemplateForm,
): FormErrors<TemplateForm> {
  return {
    ...(!form.title.trim() && { title: "Title is required" }),
    ...(form.template_description.trim().length >
      TEMPLATE_DESCRIPTION_MAX_LENGTH && {
      template_description: `Description cannot exceed ${TEMPLATE_DESCRIPTION_MAX_LENGTH} characters`,
    }),
  };
}

export function isNoteFormDirty(form: NoteForm, initial: NoteForm): boolean {
  return (
    form.title !== initial.title || form.description !== initial.description
  );
}

/** The template's values as the save sends them. */
export function templateValues(form: TemplateForm, description: string) {
  return {
    title: form.title,
    description,
    category: form.category ?? "",
    template_description: form.template_description,
  };
}

/** The new template's fields: named by its title, with the empty optional fields left out. */
export function newTemplateDoc(form: TemplateForm, description: string) {
  return {
    template_name: form.title,
    title: form.title,
    description,
    ...(form.category && { category: form.category }),
    ...(form.template_description && {
      template_description: form.template_description,
    }),
  };
}
