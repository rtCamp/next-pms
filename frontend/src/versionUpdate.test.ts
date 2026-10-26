import { describe, expect, it, vi } from "vitest";
import { toast } from "frappe-ui";
import { notifyVersionUpdates } from "./versionUpdate";

vi.mock("frappe-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("frappe-ui")>()),
  toast: { info: vi.fn() },
}));

describe("notifyVersionUpdates", () => {
  it("shows a toast with a Reload action on version-update", () => {
    const handlers = new Map<string, () => void>();
    notifyVersionUpdates({
      on: ((event: string, handler: () => void) => {
        handlers.set(event, handler);
      }) as never,
    });

    expect(toast.info).not.toHaveBeenCalled();
    handlers.get("version-update")?.();

    expect(toast.info).toHaveBeenCalledWith(
      "New version available. Please refresh the page to get the latest version.",
      expect.objectContaining({
        duration: 10000,
        action: expect.objectContaining({ label: "Reload" }),
      }),
    );
  });
});
