import { describe, expect, it } from "vitest";
import type { ProjectDoc } from "@/pages/project-details/types";
import { toDraft, toEditorHtml, yesNoLabel } from "./overview";

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
