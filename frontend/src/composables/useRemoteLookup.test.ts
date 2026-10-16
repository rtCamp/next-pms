import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { mockApi } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

const METHOD = "test.search";

interface Item {
  id: string;
  title: string;
}

const ITEMS: Item[] = [
  { id: "a", title: "Alpha" },
  { id: "b", title: "Beta" },
];

function setup(
  options: {
    query?: string;
    enabled?: boolean;
    selected?: LookupOption | null;
  } = {},
) {
  const api = mockApi({
    [METHOD]: ({ params }) =>
      ITEMS.filter((item) => item.title.includes(String(params.q ?? ""))),
  });
  const query = ref(options.query ?? "");
  const enabled = ref(options.enabled ?? true);
  const selected = ref(options.selected ?? null);
  return withSetup(() =>
    useRemoteLookup<Item[], Item>({
      method: METHOD,
      query,
      enabled,
      selected,
      debounceMs: 50,
      params: (q) => ({ q: q || undefined }),
      getItems: (response) => response ?? [],
      toOption: (item) => ({ label: item.title, value: item.id }),
    }),
  ).then((mounted) => ({ ...mounted, api, query, enabled, selected }));
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useRemoteLookup", () => {
  it("fetches at once and maps the results to options", async () => {
    const { result, api } = await setup();
    await vi.waitFor(() =>
      expect(result.options).toEqual([
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" },
      ]),
    );
    expect(api.requestsTo(METHOD)).toHaveLength(1);
    expect(result.loading).toBe(false);
  });

  it("waits until enabled", async () => {
    const { result, api, enabled } = await setup({ enabled: false });
    await nextTick();
    expect(api.requests).toHaveLength(0);
    enabled.value = true;
    await vi.waitFor(() => expect(result.options).toHaveLength(2));
  });

  it("debounces the query", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { result, api, query } = await setup();
    await vi.waitFor(() => expect(result.options).toHaveLength(2));

    query.value = "A";
    await nextTick();
    query.value = "Al";
    await nextTick();
    vi.advanceTimersByTime(49);
    expect(api.requests).toHaveLength(1);

    vi.advanceTimersByTime(1);
    await vi.waitFor(() =>
      expect(result.options).toEqual([{ label: "Alpha", value: "a" }]),
    );
    expect(api.requests.map((request) => request.params)).toEqual([
      {},
      { q: "Al" },
    ]);
  });

  it("keeps the selected option when the results don't include it", async () => {
    const { result, query } = await setup({
      selected: { label: "Beta", value: "b" },
    });
    await vi.waitFor(() => expect(result.options).toHaveLength(2));

    query.value = "Alpha";
    await vi.waitFor(() =>
      expect(result.options).toEqual([
        { label: "Beta", value: "b" },
        { label: "Alpha", value: "a" },
      ]),
    );
  });

  it("doesn't fetch while disabled, even as the query changes", async () => {
    const { api, query } = await setup({ enabled: false });
    query.value = "x";
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(api.requests).toHaveLength(0);
  });
});
