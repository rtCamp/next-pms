import { describe, expect, it } from "vitest";
import { FrappeResponseError } from "frappe-ui";
import { errorMessage } from "./errors";

function frappeError(message: string, type = "ValidationError", title = "") {
  return new FrappeResponseError(message, { type, title });
}

describe("errorMessage", () => {
  it("drops the exception type prefix from a Frappe error", () => {
    expect(errorMessage(frappeError("ValidationError: Task is closed"))).toBe(
      "Task is closed",
    );
  });

  it("strips HTML from the server's message", () => {
    expect(
      errorMessage(
        frappeError(
          "PermissionError: Not allowed on <b>Task T-1</b>",
          "PermissionError",
        ),
      ),
    ).toBe("Not allowed on Task T-1");
  });

  it("falls back to the title when the message has no type prefix", () => {
    expect(
      errorMessage(
        frappeError("ValidationError (Traceback)", "ValidationError", "Error"),
      ),
    ).toBe("Error");
  });

  it("falls back to the message when there is no title", () => {
    expect(errorMessage(frappeError("Something odd", "ValidationError"))).toBe(
      "Something odd",
    );
  });

  it("reads a plain Error's message", () => {
    expect(errorMessage(new Error("Network down"))).toBe("Network down");
  });

  it("stringifies anything else, with a default for nothing", () => {
    expect(errorMessage("boom")).toBe("boom");
    expect(errorMessage(undefined)).toBe("Something went wrong");
    expect(errorMessage(null)).toBe("Something went wrong");
  });
});
