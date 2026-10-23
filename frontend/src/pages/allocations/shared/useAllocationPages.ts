import { computed, onScopeDispose, shallowRef, watch } from "vue";
import { toast, useCall } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import { errorMessage } from "@/utils/errors";
import {
  ALLOCATIONS_PAGE_SIZE,
  REALTIME_DEBOUNCE_MS,
  RESOURCE_ALLOCATION_DOCTYPE,
} from "./constants";
import type { AllocationRefreshTargets } from "./types";
import { useAllocationDialogs } from "./useAllocationDialogs";

export type AllocationsParams = Record<
  string,
  string | number | boolean | undefined
>;

/** A loaded page of rows and the offset it was loaded from. */
export interface AllocationsPageData<TPayload> {
  start: number;
  payload: TPayload;
}

interface Approver {
  name: string;
  employee_name: string;
}

/** Employee ids to names of everyone who can approve, for the rows' reporting managers. */
export function useManagerNames() {
  const approvers = useCall<Approver[]>({
    url: "/api/v2/method/next_pms.timesheet.api.get_approver_details",
  });
  return computed(
    () =>
      new Map(
        (approvers.data ?? []).map((approver) => [
          approver.name,
          approver.employee_name,
        ]),
      ),
  );
}

/**
 * An allocations page's rows, loaded ten at a time from `url` with `params` (`start`,
 * `page_length`, `has_more`). A change to the params loads the first page again.
 *
 * `refresh` loads the loaded pages holding the targets' rows again in place: `rowIds`
 * names a page's rows and `targetIds` the targets' ones; no target ids means every
 * loaded page. Someone else's write (a `Resource Allocation` `list_update`) refreshes
 * every loaded page, debounced; it's skipped while one of the page's own writes runs,
 * and held while a resize or draft is unsaved or its save is still running.
 */
export function useAllocationPages<
  TPayload extends { has_more: boolean },
>(options: {
  url: string;
  params: () => AllocationsParams;
  rowIds: (payload: TPayload) => string[];
  targetIds: (targets?: AllocationRefreshTargets) => string[] | undefined;
}) {
  const dialogs = useAllocationDialogs();
  const unsaved = useUnsavedChanges();

  /** Identifies the query; compared as JSON since it is rebuilt on every route change. */
  const queryKey = computed(() => JSON.stringify(options.params()));

  const pageCall = useCall<TPayload, AllocationsParams>({
    url: options.url,
    immediate: false,
  });
  // Refreshes go through their own call, so they don't abort a page load. The call
  // aborts its request in flight when submitted again, so refreshes run one at a time.
  const refreshCall = useCall<TPayload, AllocationsParams>({
    url: options.url,
    immediate: false,
  });

  const pages = shallowRef<AllocationsPageData<TPayload>[]>([]);
  const loadedKey = shallowRef("");
  const pending = shallowRef<"query" | "next" | null>(null);
  // Set after a failed request so a still-visible sentinel can't retry it in a loop.
  const failed = shallowRef(false);
  let latestRequest = 0;
  /** Counts new queries; a refresh sent before the latest one is dropped. */
  let queryCount = 0;
  /** Starts of the loaded pages waiting for a refresh. */
  const queuedStarts = new Set<number>();
  let refreshing: Promise<void> | null = null;

  function request(start: number) {
    return { ...options.params(), start, page_length: ALLOCATIONS_PAGE_SIZE };
  }

  async function fetchPage(start: number, kind: "query" | "next") {
    const requestId = ++latestRequest;
    const key = queryKey.value;
    if (kind === "query") {
      queryCount += 1;
      queuedStarts.clear();
    }
    pending.value = kind;
    let payload: TPayload | null;
    try {
      payload = await pageCall.submit(request(start));
    } catch (error) {
      if (requestId !== latestRequest) return;
      pending.value = null;
      failed.value = true;
      if (kind === "query") {
        pages.value = [];
        loadedKey.value = key;
      }
      toast.error(errorMessage(error));
      return;
    }
    if (requestId !== latestRequest || !payload) return;
    pending.value = null;
    failed.value = false;
    const page = { start, payload };
    if (kind === "next") {
      pages.value = [...pages.value, page];
      return;
    }
    pages.value = [page];
    loadedKey.value = key;
  }

  watch(queryKey, () => fetchPage(0, "query"), { immediate: true });

  const hasMore = computed(
    () => !failed.value && Boolean(pages.value.at(-1)?.payload.has_more),
  );

  function loadMore() {
    const last = pages.value.at(-1);
    if (pending.value || !hasMore.value || !last) return;
    fetchPage(last.start + ALLOCATIONS_PAGE_SIZE, "next");
  }

  async function drainRefreshes() {
    try {
      while (queuedStarts.size) {
        const start = Math.min(...queuedStarts);
        queuedStarts.delete(start);
        const query = queryCount;
        let payload: TPayload | null;
        try {
          payload = await refreshCall.submit(request(start));
        } catch (error) {
          if (query !== queryCount) continue;
          queuedStarts.clear();
          toast.error(errorMessage(error));
          return;
        }
        if (!payload || query !== queryCount) continue;
        failed.value = false;
        pages.value = pages.value.map((page) =>
          page.start === start ? { start, payload } : page,
        );
      }
    } finally {
      refreshing = null;
    }
  }

  /**
   * Loads the given loaded pages again in place, keeping the rows and the scroll. Pages
   * asked for while a refresh runs join it; a new query replacing the pages meanwhile
   * wins. Resolves once every queued page has loaded.
   */
  function reloadPages(starts: number[]) {
    for (const start of starts) queuedStarts.add(start);
    if (!refreshing && queuedStarts.size) refreshing = drainRefreshes();
    return refreshing ?? Promise.resolve();
  }

  function refresh(targets?: AllocationRefreshTargets) {
    const ids = new Set(options.targetIds(targets) ?? []);
    const starts = pages.value
      .filter(
        (page) =>
          !ids.size || options.rowIds(page.payload).some((id) => ids.has(id)),
      )
      .map((page) => page.start);
    return reloadPages(starts);
  }

  let realtimeTimer: ReturnType<typeof setTimeout> | undefined;
  const realtimeHeld = shallowRef(false);

  function applyRealtimeUpdate() {
    if (pending.value === "query") return;
    if (unsaved.hasUnsavedChanges()) {
      realtimeHeld.value = true;
      return;
    }
    refresh();
  }

  useDoctypeListUpdates(RESOURCE_ALLOCATION_DOCTYPE, () => {
    if (
      dialogs.writes.inFlight > 0 ||
      Date.now() - dialogs.writes.settledAt < REALTIME_DEBOUNCE_MS
    ) {
      return;
    }
    clearTimeout(realtimeTimer);
    realtimeTimer = setTimeout(applyRealtimeUpdate, REALTIME_DEBOUNCE_MS);
  });
  onScopeDispose(() => clearTimeout(realtimeTimer));

  watch(
    () =>
      realtimeHeld.value &&
      !unsaved.hasUnsavedChanges() &&
      dialogs.writes.inFlight === 0,
    (release) => {
      if (!release) return;
      realtimeHeld.value = false;
      refresh();
    },
  );

  return {
    pages,
    /** The query key of the loaded rows; changes once a new query has loaded. */
    loadedKey,
    hasMore,
    /** A new query is loading: the first page, or a filter or date change. */
    isQueryLoading: computed(() => pending.value === "query"),
    isNextPageLoading: computed(() => pending.value === "next"),
    loadMore,
    refresh,
  };
}
