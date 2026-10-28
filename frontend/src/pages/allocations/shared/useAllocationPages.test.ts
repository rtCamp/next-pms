import { effectScope, nextTick, reactive, shallowRef, type Ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REALTIME_DEBOUNCE_MS } from "./constants";
import {
  useAllocationPages,
  type AllocationsParams,
} from "./useAllocationPages";

interface Payload {
  has_more: boolean;
  ids: string[];
}

interface Sent {
  params: AllocationsParams;
  resolve: (payload: Payload) => void;
  reject: (error: Error) => void;
}

/**
 * A `useCall` that behaves like frappe-ui's over VueUse's fetch: submitting again aborts
 * the request in flight, whose submit then resolves with the last response that landed.
 */
function fakeCall() {
  const sent: Sent[] = [];
  let lastData: Payload | null = null;
  let inFlight: { settle: (payload: Payload | null) => void } | null = null;
  return {
    sent,
    get busy() {
      return inFlight !== null;
    },
    submit(params: AllocationsParams) {
      inFlight?.settle(lastData);
      return new Promise<Payload | null>((resolve, reject) => {
        const own = { settle: resolve };
        inFlight = own;
        const done = () => {
          if (inFlight === own) inFlight = null;
        };
        sent.push({
          params,
          resolve: (payload) => {
            done();
            lastData = payload;
            resolve(payload);
          },
          reject: (error) => {
            done();
            reject(error);
          },
        });
      });
    },
  };
}

const mocks = vi.hoisted(() => ({
  calls: [] as ReturnType<typeof fakeCall>[],
  dirty: null as unknown as Ref<boolean>,
  onListUpdate: null as (() => void) | null,
  writes: { inFlight: 0, settledAt: 0 },
}));

vi.mock("frappe-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("frappe-ui")>()),
  toast: { error: vi.fn() },
  useCall: () => {
    const call = fakeCall();
    mocks.calls.push(call);
    return call;
  },
}));
vi.mock("@/composables/useDoctypeListUpdates", () => ({
  useDoctypeListUpdates: (_doctype: string, onUpdate: () => void) => {
    mocks.onListUpdate = onUpdate;
  },
}));
vi.mock("@/composables/useUnsavedChanges", () => ({
  useUnsavedChanges: () => ({ hasUnsavedChanges: () => mocks.dirty.value }),
}));
vi.mock("./useAllocationDialogs", () => ({
  useAllocationDialogs: () => ({ writes: mocks.writes }),
}));

const page = (ids: string[], hasMore = false): Payload => ({
  has_more: hasMore,
  ids,
});

const flush = async () => {
  for (let i = 0; i < 5; i++) await nextTick();
};

function setup() {
  const search = shallowRef("");
  const scope = effectScope();
  const rows = scope.run(() =>
    useAllocationPages<Payload>({
      url: "/api/rows",
      params: () => ({ search: search.value }),
      rowIds: (payload) => payload.ids,
      targetIds: (targets) => targets?.employeeIds,
    }),
  )!;
  const [pageCall, refreshCall] = mocks.calls;
  return { rows, search, pageCall, refreshCall, scope };
}

/** Loads two pages: A, B on the first and C, D on the second. */
async function loadTwoPages() {
  const loaded = setup();
  loaded.pageCall.sent[0].resolve(page(["A", "B"], true));
  await flush();
  loaded.rows.loadMore();
  loaded.pageCall.sent[1].resolve(page(["C", "D"], true));
  await flush();
  return loaded;
}

const idsOf = (rows: ReturnType<typeof setup>["rows"]) =>
  rows.pages.value.map((loaded) => [loaded.start, loaded.payload.ids]);

beforeEach(() => {
  mocks.calls = [];
  mocks.dirty = shallowRef(false);
  mocks.onListUpdate = null;
  mocks.writes = reactive({ inFlight: 0, settledAt: 0 });
});

afterEach(() => vi.useRealTimers());

describe("useAllocationPages refresh", () => {
  it("runs overlapping refreshes one at a time, each page into its own slot", async () => {
    const { rows, refreshCall } = await loadTwoPages();
    const first = rows.refresh({ employeeIds: ["A"] });
    const second = rows.refresh({ employeeIds: ["C"] });
    expect(refreshCall.sent).toHaveLength(1);
    refreshCall.sent[0].resolve(page(["A", "B2"], true));
    await flush();
    expect(refreshCall.sent).toHaveLength(2);
    expect(refreshCall.sent[1].params.start).toBe(10);
    refreshCall.sent[1].resolve(page(["C", "D2"], true));
    await Promise.all([first, second]);
    expect(idsOf(rows)).toEqual([
      [0, ["A", "B2"]],
      [10, ["C", "D2"]],
    ]);
  });

  it("keeps refreshing the remaining pages when the next page loads meanwhile", async () => {
    const { rows, pageCall, refreshCall } = await loadTwoPages();
    const refreshed = rows.refresh();
    rows.loadMore();
    refreshCall.sent[0].resolve(page(["A", "B2"], true));
    pageCall.sent[2].resolve(page(["E"]));
    await flush();
    refreshCall.sent[1].resolve(page(["C", "D2"], true));
    await refreshed;
    expect(idsOf(rows)).toEqual([
      [0, ["A", "B2"]],
      [10, ["C", "D2"]],
      [20, ["E"]],
    ]);
  });

  it("drops a refresh sent before a new query", async () => {
    const { rows, search, pageCall, refreshCall } = await loadTwoPages();
    const refreshed = rows.refresh();
    search.value = "x";
    await flush();
    refreshCall.sent[0].resolve(page(["stale"], true));
    pageCall.sent[2].resolve(page(["X"]));
    await refreshed;
    expect(refreshCall.sent).toHaveLength(1);
    expect(idsOf(rows)).toEqual([[0, ["X"]]]);
  });

  it("loads more again after a failed next page once a refresh succeeds", async () => {
    const { rows, pageCall, refreshCall } = setup();
    pageCall.sent[0].resolve(page(["A"], true));
    await flush();
    rows.loadMore();
    pageCall.sent[1].reject(new Error("timeout"));
    await flush();
    expect(rows.hasMore.value).toBe(false);
    const refreshed = rows.refresh();
    refreshCall.sent[0].resolve(page(["A"], true));
    await refreshed;
    expect(rows.hasMore.value).toBe(true);
    rows.loadMore();
    expect(pageCall.sent[2].params.start).toBe(10);
  });
});

describe("useAllocationPages realtime", () => {
  it("runs an update held during an edit once the edit's save settles", async () => {
    vi.useFakeTimers();
    const { rows, pageCall, refreshCall } = setup();
    pageCall.sent[0].resolve(page(["A"]));
    await flush();
    mocks.dirty.value = true;
    mocks.onListUpdate!();
    vi.advanceTimersByTime(REALTIME_DEBOUNCE_MS);
    expect(refreshCall.sent).toHaveLength(0);

    mocks.writes.inFlight = 1;
    mocks.dirty = shallowRef(false);
    await flush();
    expect(refreshCall.sent).toHaveLength(0);

    mocks.writes.inFlight = 0;
    await flush();
    expect(refreshCall.sent).toHaveLength(1);
    expect(rows.pages.value).toHaveLength(1);
  });
});
