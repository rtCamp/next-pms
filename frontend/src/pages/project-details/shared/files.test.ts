import { describe, expect, it } from "vitest";
import { fileBaseName, fileExtension } from "./files";

describe("fileExtension", () => {
  it.each([
    ["report.pdf", "PDF"],
    ["archive.tar.gz", "GZ"],
    ["README", "FILE"],
    ["trailing.", "FILE"],
  ])("reads %s as %s", (name, expected) => {
    expect(fileExtension(name)).toBe(expected);
  });
});

describe("fileBaseName", () => {
  it("drops the last extension only", () => {
    expect(fileBaseName("archive.tar.gz")).toBe("archive.tar");
    expect(fileBaseName("README")).toBe("README");
  });
});
