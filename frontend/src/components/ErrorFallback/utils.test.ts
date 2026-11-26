import { describe, expect, it } from "vitest";
import { isRenderError } from "./utils";

const prod = (code: string) =>
  `https://vuejs.org/error-reference/#runtime-${code}`;

describe("isRenderError", () => {
  it.each(["setup function", "render function", "mounted hook"])(
    "takes the dev name %s",
    (info) => expect(isRenderError(info)).toBe(true),
  );

  it.each(["0", "1", "15", "bm", "m"])("takes the production code %s", (code) =>
    expect(isRenderError(prod(code))).toBe(true),
  );

  it.each([
    "component event handler",
    "native event handler",
    "watcher callback",
    prod("5"),
    prod("6"),
    prod("3"),
    prod("um"),
  ])("leaves %s to the app", (info) => expect(isRenderError(info)).toBe(false));
});
