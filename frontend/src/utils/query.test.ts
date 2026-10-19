import { describe, expect, it } from "vitest";
import { parseColumnKeys, parseJSONArrayParam, queryString } from "./query";

describe("queryString", () => {
  it("returns the value, or the first of several", () => {
    expect(queryString("a")).toBe("a");
    expect(queryString(["a", "b"])).toBe("a");
  });

  it("returns an empty string when missing", () => {
    expect(queryString(undefined)).toBe("");
    expect(queryString(null)).toBe("");
    expect(queryString([])).toBe("");
    expect(queryString([null])).toBe("");
  });
});

describe("parseJSONArrayParam", () => {
  it("parses a JSON array", () => {
    expect(parseJSONArrayParam('["Open","Working"]')).toEqual([
      "Open",
      "Working",
    ]);
  });

  it("decodes before parsing", () => {
    expect(
      parseJSONArrayParam(encodeURI('["Pending Review"]'), decodeURI),
    ).toEqual(["Pending Review"]);
  });

  it.each(["", "not json", '{"a":1}', '"Open"'])("returns [] for %j", (raw) => {
    expect(parseJSONArrayParam(raw)).toEqual([]);
  });
});

describe("parseColumnKeys", () => {
  const known = new Set(["subject", "status", "priority"]);

  it("keeps known keys in order, without duplicates", () => {
    expect(parseColumnKeys("status,unknown,subject,status", known)).toEqual([
      "status",
      "subject",
    ]);
  });

  it("returns [] for an empty value", () => {
    expect(parseColumnKeys("", known)).toEqual([]);
  });
});
