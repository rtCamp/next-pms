import { describe, expect, it } from "vitest";
import { formatRelativeTimeShort, stripHtml, stripTags } from "./text";

const now = new Date(2026, 9, 16, 12, 0, 0);

function ago(ms: number) {
  return new Date(now.getTime() - ms);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTimeShort", () => {
  it.each([
    [0, "now", "now"],
    [30_000, "now", "now"],
    [MINUTE, "1min ago", "1 minute ago"],
    [45 * MINUTE, "45min ago", "45 minutes ago"],
    [HOUR, "1h ago", "1 hour ago"],
    [23 * HOUR, "23h ago", "23 hours ago"],
    [DAY, "1d ago", "1 day ago"],
    [6 * DAY, "6d ago", "6 days ago"],
    [7 * DAY, "1w ago", "1 week ago"],
    [29 * DAY, "4w ago", "4 weeks ago"],
    [30 * DAY, "1m ago", "1 month ago"],
    [200 * DAY, "6m ago", "6 months ago"],
    [365 * DAY, "1y ago", "1 year ago"],
    [800 * DAY, "2y ago", "2 years ago"],
  ])("formats %d ms ago as %s / %s", (ms, short, long) => {
    expect(formatRelativeTimeShort(ago(ms), now)).toBe(short);
    expect(formatRelativeTimeShort(ago(ms), now, true)).toBe(long);
  });

  it("returns now for a future date", () => {
    expect(formatRelativeTimeShort(new Date(now.getTime() + DAY), now)).toBe(
      "now",
    );
  });

  it("accepts a Frappe datetime string", () => {
    expect(formatRelativeTimeShort("2026-10-16 10:00:00", now)).toBe("2h ago");
  });
});

describe("stripTags", () => {
  it("removes tags, decodes &nbsp; and collapses whitespace", () => {
    expect(stripTags("<p>Hello&nbsp;<b>world</b></p>\n<p> again </p>")).toBe(
      "Hello world again",
    );
  });

  it("returns an empty string for markup without text", () => {
    expect(stripTags("<p><br></p>")).toBe("");
  });
});

describe("stripHtml", () => {
  it("returns the text content, decoding entities", () => {
    expect(stripHtml("<p>Tom &amp; <i>Jerry</i></p>")).toBe("Tom & Jerry");
  });

  it("doesn't run scripts or keep their tags", () => {
    expect(stripHtml('<img src=x onerror="alert(1)">safe')).toBe("safe");
  });
});
