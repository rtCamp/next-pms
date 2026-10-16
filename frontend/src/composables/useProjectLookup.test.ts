import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import { useProjectLookup } from "./useProjectLookup";

const originalBoot = window.boot;

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  window.boot = originalBoot;
});

async function setup(query: string, icon?: string) {
  const api = mockApi({
    "frappe.client.get_list": () => [
      { name: "P-1", project_name: "Website", customer: "Acme" },
    ],
  });
  const { result } = await withSetup(() => useProjectLookup({ query, icon }));
  await vi.waitFor(() => expect(result.options).toHaveLength(1));
  return { result, params: api.requests[0].params };
}

describe("useProjectLookup", () => {
  it("lists projects without a search", async () => {
    window.boot = { sitename: "test" };
    const { params } = await setup("");
    expect(params).toEqual({
      doctype: "Project",
      fields: '["name","project_name","customer"]',
      filters: "[]",
      limit_page_length: "20",
    });
  });

  it("searches by id or name", async () => {
    const { params } = await setup("web");
    expect(JSON.parse(String(params.or_filters))).toEqual([
      ["Project", "name", "like", "%web%"],
      ["Project", "project_name", "like", "%web%"],
    ]);
  });

  it("applies the boot's project filters", async () => {
    window.boot = {
      sitename: "test",
      global_filters: { project: [["Project", "name", "in", ["P-1"]]] },
    };
    const { params } = await setup("");
    expect(JSON.parse(String(params.filters))).toEqual([
      ["Project", "name", "in", ["P-1"]],
    ]);
  });

  it("labels options with the project name and the icon", async () => {
    const { result } = await setup("", "lucide-folder");
    expect(result.options).toEqual([
      { label: "Website", value: "P-1", icon: "lucide-folder" },
    ]);
  });
});
