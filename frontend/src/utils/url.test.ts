import { describe, expect, it } from "vitest";
import { safeExternalUrl } from "./url";

describe("safeExternalUrl", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["http://example.com", "http://example.com/"],
    ["mailto:team@example.com", "mailto:team@example.com"],
    ["  https://example.com  ", "https://example.com/"],
  ])("keeps the safe URL %s", (value, expected) => {
    expect(safeExternalUrl(value)).toBe(expected);
  });

  it.each([
    ["example.com", "https://example.com/"],
    ["example.com/path", "https://example.com/path"],
    ["//example.com", "https://example.com/"],
    ["localhost:3000/path", "https://localhost:3000/path"],
  ])("adds https:// to %s", (value, expected) => {
    expect(safeExternalUrl(value)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "javascript://example.com/%0Aalert(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "data:text/html,hi",
  ])("rejects %s", (value) => {
    expect(safeExternalUrl(value)).toBeUndefined();
  });

  it.each([undefined, null, "", "   "])("returns undefined for %s", (value) => {
    expect(safeExternalUrl(value)).toBeUndefined();
  });
});
