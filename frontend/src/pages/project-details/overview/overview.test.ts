import { describe, expect, it } from "vitest";
import type { ProjectDoc } from "@/pages/project-details/types";
import { changedFields, toDraft, toEditorHtml, yesNoLabel } from "./overview";

const DOC: ProjectDoc = {
  name: "PROJ-0001",
  project_name: "Atlas",
  modified: "2026-10-21 10:00:00",
};

describe("toEditorHtml", () => {
  it("keeps HTML as it is", () => {
    expect(toEditorHtml("<p>Hi</p>")).toBe("<p>Hi</p>");
  });

  it("keeps an empty value empty", () => {
    expect(toEditorHtml("")).toBe("");
    expect(toEditorHtml("  ")).toBe("  ");
  });

  it("turns plain text into paragraphs with line breaks", () => {
    expect(toEditorHtml("One\r\nTwo\n\nThree & <four")).toBe(
      "<p>One<br>Two</p><p>Three &amp; &lt;four</p>",
    );
  });
});

describe("toDraft", () => {
  it("reads every field as a string, empty when unset", () => {
    const draft = toDraft({
      ...DOC,
      priority: "High",
      custom_host: null,
      custom_restricted_under_nda: 1,
      custom_permission_for_case_study: 0,
    });
    expect(draft.priority).toBe("High");
    expect(draft.custom_host).toBe("");
    expect(draft.custom_source).toBe("");
    expect(draft.custom_restricted_under_nda).toBe("1");
    expect(draft.custom_permission_for_case_study).toBe("0");
    expect(draft.custom_permission_for_testimonial).toBe("");
  });

  it("reads Desk plain text in the rich-text fields as HTML", () => {
    const draft = toDraft({
      ...DOC,
      custom_executive_summary: "One\nTwo",
      custom_key_goals: "<p>Goal</p>",
    });
    expect(draft.custom_executive_summary).toBe("<p>One<br>Two</p>");
    expect(draft.custom_key_goals).toBe("<p>Goal</p>");
  });
});

describe("yesNoLabel", () => {
  it.each([
    ["1", "Yes"],
    ["0", "No"],
    ["", "—"],
  ])("reads %j as %s", (value, label) => {
    expect(yesNoLabel(value)).toBe(label);
  });
});

describe("changedFields", () => {
  const doc: ProjectDoc = {
    ...DOC,
    priority: "Medium",
    custom_host: null,
    custom_executive_summary: "<p>Summary</p>",
    custom_key_goals: null,
    custom_restricted_under_nda: 0,
  };
  const all = () => true;

  it("is empty when nothing changed", () => {
    expect(changedFields(toDraft(doc), toDraft(doc), all)).toEqual({});
  });

  it("returns only the changed fields", () => {
    const draft = { ...toDraft(doc), priority: "High", custom_host: "AWS" };
    expect(changedFields(draft, toDraft(doc), all)).toEqual({
      priority: "High",
      custom_host: "AWS",
    });
  });

  it("is empty again after a change is reverted", () => {
    const draft = { ...toDraft(doc), priority: "High" };
    draft.priority = "Medium";
    expect(changedFields(draft, toDraft(doc), all)).toEqual({});
  });

  it("saves a cleared field as an empty string", () => {
    const draft = { ...toDraft(doc), priority: "" };
    expect(changedFields(draft, toDraft(doc), all)).toEqual({ priority: "" });
  });

  it("saves Checks as 0 or 1, and leaves an untouched blank Check alone", () => {
    const draft = {
      ...toDraft(doc),
      custom_restricted_under_nda: "1",
      custom_permission_for_testimonial: "",
    };
    expect(changedFields(draft, toDraft(doc), all)).toEqual({
      custom_restricted_under_nda: 1,
    });
    expect(
      changedFields(
        { ...toDraft(doc), custom_permission_for_case_study: "0" },
        toDraft(doc),
        all,
      ),
    ).toEqual({ custom_permission_for_case_study: 0 });
  });

  it("leaves out optional fields the site lacks", () => {
    const draft = {
      ...toDraft(doc),
      custom_source: "Google",
      custom_restricted_under_nda: "1",
      custom_previous_cms: "Drupal",
    };
    const has = (field: string) => field === "custom_previous_cms";
    expect(changedFields(draft, toDraft(doc), has)).toEqual({
      custom_previous_cms: "Drupal",
    });
  });

  it("treats an emptied editor as unchanged from an empty field", () => {
    const draft = { ...toDraft(doc), custom_key_goals: "<p></p>" };
    expect(changedFields(draft, toDraft(doc), all)).toEqual({});
  });

  it("doesn't save Desk plain text that wasn't edited", () => {
    const plain = { ...doc, custom_executive_summary: "One\nTwo" };
    expect(changedFields(toDraft(plain), toDraft(plain), all)).toEqual({});
  });

  it("saves edited rich text as HTML", () => {
    const draft = {
      ...toDraft(doc),
      custom_executive_summary: "<p>Summary <strong>now</strong></p>",
    };
    expect(changedFields(draft, toDraft(doc), all)).toEqual({
      custom_executive_summary: "<p>Summary <strong>now</strong></p>",
    });
  });
});
