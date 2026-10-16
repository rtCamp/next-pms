import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "@/test/api";

const PHASES = [
  { phase: "Discovery", color: "blue", position: 1 },
  { phase: "Build", color: null, position: 2 },
];

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("useProjectPhases", () => {
  it("loads the phases once and shares them", async () => {
    const api = mockApi({ "frappe.client.get_list": () => PHASES });
    const { useProjectPhases } = await import("./useProjectPhases");

    const first = useProjectPhases();
    expect(first.phases).toEqual([]);
    await vi.waitFor(() => expect(first.phases).toEqual(PHASES));
    const second = useProjectPhases();
    expect(second.phases).toEqual(PHASES);
    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].params).toEqual({
      doctype: "Project Phase",
      fields: '["phase","color","position"]',
      order_by: "position asc",
      limit_page_length: "0",
    });
    expect(first.loading).toBe(false);
    expect(first.error).toBeNull();
  });

  it("finds a phase's record by name", async () => {
    mockApi({ "frappe.client.get_list": () => PHASES });
    const { useProjectPhases } = await import("./useProjectPhases");
    const phases = useProjectPhases();
    await vi.waitFor(() => expect(phases.phases).toHaveLength(2));
    expect(phases.phaseOf("Build")).toEqual(PHASES[1]);
    expect(phases.phaseOf("Unknown")).toBeUndefined();
    expect(phases.phaseOf(null)).toBeUndefined();
  });
});
