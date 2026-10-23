import { describe, expect, it } from "vitest";
import type { ProjectReportRow } from "@/pages/project-details/types";
import {
  durationPresets,
  formatGeneratedOn,
  previousReportUrl,
  repositoryOptions,
  sortReports,
} from "./utils";

const report = (overrides: Partial<ProjectReportRow>): ProjectReportRow => ({
  run_id: "",
  date_range: "",
  status: "Done",
  ...overrides,
});

describe("durationPresets", () => {
  it("ends every range today", () => {
    expect(durationPresets(new Date(2026, 9, 19))).toEqual([
      { label: "Last Week", range: ["2026-10-13", "2026-10-19"] },
      { label: "Last 15 Days", range: ["2026-10-05", "2026-10-19"] },
      { label: "Last Month", range: ["2026-09-20", "2026-10-19"] },
    ]);
  });
});

describe("sortReports", () => {
  it("puts generating first, then the newest, numbered from the oldest", () => {
    const rows = sortReports([
      report({ run_id: "a", generated_on: "2026-01-01 10:00:00" }),
      report({ run_id: "b", generated_on: "2026-03-01 10:00:00" }),
      report({ run_id: "c", status: "Generating" }),
      report({ run_id: "", generated_on: "2026-02-01 10:00:00" }),
    ]);
    expect(rows.map((row) => [row.id, row.index])).toEqual([
      ["c", 4],
      ["b", 3],
      ["report-2", 2],
      ["a", 1],
    ]);
  });
});

describe("previousReportUrl", () => {
  it("returns the last linked report", () => {
    expect(
      previousReportUrl([
        report({ report_link: "https://a" }),
        report({ report_link: "https://b" }),
        report({}),
      ]),
    ).toBe("https://b");
    expect(previousReportUrl([])).toBe("");
  });
});

describe("repositoryOptions", () => {
  it("labels each repository by its short name", () => {
    expect(
      repositoryOptions([
        { name: "1", github_repository: "https://github.com/org/repo/" },
        { name: "2" },
      ]),
    ).toEqual([{ label: "repo", value: "https://github.com/org/repo/" }]);
  });
});

describe("formatGeneratedOn", () => {
  it("formats the time, or a dash when missing", () => {
    expect(formatGeneratedOn("2026-10-19 14:05:00")).toBe("19 Oct 2026, 14:05");
    expect(formatGeneratedOn(undefined)).toBe("—");
  });
});
