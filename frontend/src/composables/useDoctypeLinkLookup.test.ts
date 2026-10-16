import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mockApi } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import {
  useDoctypeLinkLookup,
  type DoctypeLinkLookupOptions,
} from "./useDoctypeLinkLookup";

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function setup(
  options: Omit<DoctypeLinkLookupOptions, "query">,
  response: unknown,
  query = "",
) {
  const api = mockApi({
    "frappe.client.get_list": () => response,
    "custom.search": () => response,
  });
  const { result } = await withSetup(() =>
    useDoctypeLinkLookup({ ...options, query: ref(query) }),
  );
  await vi.waitFor(() => expect(api.requests).toHaveLength(1));
  return { result, request: api.requests[0] };
}

describe("useDoctypeLinkLookup", () => {
  it("searches get_list by name by default", async () => {
    const { result, request } = await setup(
      { doctype: "Project" },
      [{ name: "P-1" }],
      "web",
    );
    expect(request.path).toBe("frappe.client.get_list");
    expect(request.params).toEqual({
      doctype: "Project",
      fields: '["name"]',
      limit_page_length: "20",
      order_by: "name asc",
      filters: '[["name","like","%web%"]]',
    });
    await vi.waitFor(() =>
      expect(result.options).toEqual([{ label: "P-1", value: "P-1" }]),
    );
  });

  it("fetches the label field and adds the given filters", async () => {
    const { result, request } = await setup(
      {
        doctype: "Employee",
        labelField: "employee_name",
        filters: [["status", "=", "Active"]],
      },
      [{ name: "E-1", employee_name: "Ada" }, { name: "E-2" }],
    );
    expect(request.params).toMatchObject({
      fields: '["name","employee_name"]',
      order_by: "employee_name asc",
      filters: '[["status","=","Active"]]',
    });
    await vi.waitFor(() =>
      expect(result.options).toEqual([
        { label: "Ada", value: "E-1" },
        { label: "E-2", value: "E-2" },
      ]),
    );
  });

  it("searches a custom method with the query as employee_name", async () => {
    const { result, request } = await setup(
      {
        doctype: "Employee",
        labelField: "employee_name",
        filters: [["status", "=", "Active"]],
        customMethod: {
          method: "custom.search",
          args: { ids: ["E-1"], limit: 5, skip: null },
        },
      },
      { data: [{ name: "E-1", employee_name: "Ada" }] },
      "Ad",
    );
    expect(request.path).toBe("custom.search");
    expect(request.params).toEqual({
      employee_name: "Ad",
      page_length: "20",
      start: "0",
      filters: '[["status","=","Active"]]',
      ids: '["E-1"]',
      limit: "5",
    });
    await vi.waitFor(() =>
      expect(result.options).toEqual([{ label: "Ada", value: "E-1" }]),
    );
  });

  it("treats get_list as the custom method like the default", async () => {
    const { request } = await setup(
      {
        doctype: "Project",
        customMethod: { method: "frappe.client.get_list" },
      },
      [],
    );
    expect(request.params).toHaveProperty("doctype", "Project");
  });
});
