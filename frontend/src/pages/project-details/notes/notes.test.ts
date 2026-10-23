import { describe, expect, it } from "vitest";
import {
  authorIds,
  authorOptions,
  categoryOptions,
  exportFileName,
  hasBody,
  initialNoteForm,
  isNoteFormDirty,
  newTemplateDoc,
  noteFormErrors,
  noteListFilters,
  templateFormErrors,
  templateListFilters,
  templateSummary,
  templateValues,
  toNotes,
} from "./notes";
import type { NoteRow, NoteTemplate, NoteUser } from "./types";

const row = (overrides: Partial<NoteRow> = {}): NoteRow => ({
  name: "PSU-1",
  title: "Weekly update",
  description: "<p>Body</p>",
  status: "Publish",
  project: "PROJ-1",
  pinned: 0,
  creation: "2026-10-20 10:00:00",
  modified: "2026-10-21 10:00:00",
  last_edited_at: null,
  last_edited_by: null,
  owner: "ann@example.com",
  modified_by: "ann@example.com",
  ...overrides,
});

const users: NoteUser[] = [
  { name: "ann@example.com", full_name: " Ann Lee ", user_image: "/ann.png" },
  { name: "bob@example.com", full_name: null, user_image: null },
];

const template = (overrides: Partial<NoteTemplate> = {}): NoteTemplate => ({
  name: "Retro",
  template_name: "Retro",
  title: "Sprint retro",
  description: "<p>What <b>went</b> well</p>",
  template_description: null,
  category: null,
  ...overrides,
});

describe("noteListFilters", () => {
  it("lists the project's published notes", () => {
    expect(
      noteListFilters("PROJ-1", { title: "", description: "", author: "" }),
    ).toEqual([
      ["project", "=", "PROJ-1"],
      ["status", "=", "Publish"],
    ]);
  });

  it("adds the author and the trimmed searches", () => {
    expect(
      noteListFilters("PROJ-1", {
        title: " plan ",
        description: "risk",
        author: "ann@example.com",
      }),
    ).toEqual([
      ["project", "=", "PROJ-1"],
      ["status", "=", "Publish"],
      ["owner", "=", "ann@example.com"],
      ["title", "like", "%plan%"],
      ["description", "like", "%risk%"],
    ]);
  });
});

describe("authors", () => {
  it("dedupes the owners in order", () => {
    expect(
      authorIds([
        { owner: "bob@example.com" },
        { owner: "ann@example.com" },
        { owner: "bob@example.com" },
        { owner: "" },
      ]),
    ).toEqual(["bob@example.com", "ann@example.com"]);
  });

  it("offers All and the authors with a name", () => {
    expect(
      authorOptions(
        ["bob@example.com", "ann@example.com", "eve@example.com"],
        users,
      ),
    ).toEqual([
      { label: "All", value: "" },
      { label: "Ann Lee", value: "ann@example.com" },
    ]);
  });
});

describe("toNotes", () => {
  it("adds the author and reads pinned as a boolean", () => {
    expect(toNotes([row({ pinned: 1 })], users)[0]).toMatchObject({
      pinned: true,
      ownerName: "Ann Lee",
      ownerImage: "/ann.png",
    });
  });

  it("leaves an unknown author blank", () => {
    expect(
      toNotes([row({ owner: "eve@example.com" })], users)[0],
    ).toMatchObject({ pinned: false, ownerName: "", ownerImage: null });
  });
});

describe("exportFileName", () => {
  const now = new Date(2026, 9, 23, 9, 5, 7);

  it("slugs the title and stamps the time", () => {
    expect(exportFileName("Q4 plan: Risks & Ideas!", now)).toBe(
      "q4-plan-risks-ideas-2026-10-23-090507.txt",
    );
  });

  it("keeps letters of any script and caps the title at 50 characters", () => {
    expect(exportFileName("Überblick", now)).toBe(
      "überblick-2026-10-23-090507.txt",
    );
    expect(exportFileName("a".repeat(60), now)).toBe(
      `${"a".repeat(50)}-2026-10-23-090507.txt`,
    );
  });

  it("falls back to note", () => {
    expect(exportFileName("!!!", now)).toBe("note-2026-10-23-090507.txt");
  });
});

describe("templates", () => {
  it("filters by category and searches the name and title", () => {
    expect(templateListFilters(" retro ", "Weekly")).toEqual({
      filters: [["Project Status Update Template", "category", "=", "Weekly"]],
      or_filters: [
        ["Project Status Update Template", "template_name", "like", "%retro%"],
        ["Project Status Update Template", "title", "like", "%retro%"],
      ],
    });
    expect(templateListFilters("", null)).toEqual({
      filters: undefined,
      or_filters: undefined,
    });
  });

  it("summarises with the description, else the body's text", () => {
    expect(templateSummary(template({ template_description: "Short" }))).toBe(
      "Short",
    );
    expect(templateSummary(template())).toBe("What went well");
  });

  it("offers typed text as a new category unless one matches", () => {
    const existing = [{ label: "Weekly", value: "Weekly" }];
    expect(categoryOptions(existing, "weekly")).toEqual(existing);
    expect(categoryOptions(existing, " ")).toEqual(existing);
    expect(categoryOptions(existing, " Retro ")).toEqual([
      ...existing,
      { label: "Retro", value: "Retro", description: "New category" },
    ]);
  });

  it("builds the saved values, leaving empty optional fields out of a new one", () => {
    const form = { title: "Retro", category: null, template_description: "" };
    expect(templateValues(form, "<p>x</p>")).toEqual({
      title: "Retro",
      description: "<p>x</p>",
      category: "",
      template_description: "",
    });
    expect(newTemplateDoc(form, "<p>x</p>")).toEqual({
      template_name: "Retro",
      title: "Retro",
      description: "<p>x</p>",
    });
    expect(
      newTemplateDoc(
        { ...form, category: "Weekly", template_description: "Short" },
        "<p>x</p>",
      ),
    ).toMatchObject({ category: "Weekly", template_description: "Short" });
  });
});

describe("the editor form", () => {
  it("starts from the note, else the template's title or name and body", () => {
    expect(initialNoteForm(row(), template())).toEqual({
      title: "Weekly update",
      description: "<p>Body</p>",
    });
    expect(initialNoteForm(null, template())).toEqual({
      title: "Sprint retro",
      description: "<p>What <b>went</b> well</p>",
    });
    expect(initialNoteForm(null, template({ title: null }))).toMatchObject({
      title: "Retro",
    });
    expect(initialNoteForm(null, null)).toEqual({ title: "", description: "" });
  });

  it("requires a title and a body with text", () => {
    expect(noteFormErrors({ title: " ", description: "<p></p>" })).toEqual({
      title: "Title is required",
      description: "Description is required",
    });
    expect(noteFormErrors({ title: "A", description: "<p>B</p>" })).toEqual({});
    expect(hasBody("<p>&nbsp;</p>")).toBe(false);
  });

  it("requires a template title and caps its description", () => {
    expect(
      templateFormErrors({
        title: "",
        category: null,
        template_description: "x".repeat(141),
      }),
    ).toEqual({
      title: "Title is required",
      template_description: "Description cannot exceed 140 characters",
    });
  });

  it("is dirty when the title or body changed", () => {
    const initial = { title: "A", description: "<p>B</p>" };
    expect(isNoteFormDirty({ ...initial }, initial)).toBe(false);
    expect(isNoteFormDirty({ ...initial, title: "A!" }, initial)).toBe(true);
    expect(isNoteFormDirty({ ...initial, description: "" }, initial)).toBe(
      true,
    );
  });
});
