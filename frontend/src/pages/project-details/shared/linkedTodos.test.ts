import { describe, expect, it } from "vitest";
import { deleteRecordMessage } from "./linkedTodos";

describe("deleteRecordMessage", () => {
  it("names the record and says when its linked ToDos stay", () => {
    expect(deleteRecordMessage("Growth initiative", "Upsell", false)).toBe(
      'Are you sure you want to delete the growth initiative "Upsell"? This action cannot be undone.',
    );
    expect(deleteRecordMessage("growth initiative", "Upsell", true)).toBe(
      'Are you sure you want to delete the growth initiative "Upsell"? Its linked ToDos will not be deleted. This action cannot be undone.',
    );
  });
});
