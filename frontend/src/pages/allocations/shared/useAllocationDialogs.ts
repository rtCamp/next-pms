import {
  inject,
  onScopeDispose,
  provide,
  reactive,
  shallowRef,
  type InjectionKey,
} from "vue";
import type { AllocationEventData } from "@/components/GanttGrid";
import type { AllocationsView } from "./constants";
import type { AllocationRefreshTargets } from "./types";

/** The Add / Edit dialog's open request. */
export interface AllocationFormRequest {
  mode: "add" | "edit";
  data: AllocationEventData;
  /** The allocation's or project's Customer id, when the page knows it. */
  customerId?: string;
}

/** What the page under the layout lends the dialogs. */
export interface AllocationsPage {
  /** Loads the rows of these employees or projects again; every loaded row without targets. */
  refresh: (targets?: AllocationRefreshTargets) => Promise<void>;
  /** The Customer id of the allocation, or of its project, from the loaded rows. */
  customerIdFor: (data: AllocationEventData) => string | undefined;
}

function createAllocationDialogs(view: AllocationsView) {
  const page = shallowRef<AllocationsPage | null>(null);
  const form = reactive({
    open: false,
    request: null as AllocationFormRequest | null,
  });
  /** The page's own writes: realtime updates they cause are not loaded twice. */
  const writes = reactive({ inFlight: 0, settledAt: 0 });

  function openForm(
    mode: AllocationFormRequest["mode"],
    data: AllocationEventData,
  ) {
    form.request = { mode, data, customerId: page.value?.customerIdFor(data) };
    form.open = true;
  }

  return {
    view,
    form,
    writes,
    openAdd: (data: AllocationEventData = {}) => openForm("add", data),
    openEdit: (data: AllocationEventData) => openForm("edit", data),
    /** Lets the page's data take part; returns its unregister. */
    registerPage(next: AllocationsPage) {
      page.value = next;
      return () => {
        if (page.value === next) page.value = null;
      };
    },
    refresh: (targets?: AllocationRefreshTargets) =>
      page.value?.refresh(targets) ?? Promise.resolve(),
    /** Runs one of the page's writes, with the refresh that follows it. */
    async runWrite<T>(write: () => Promise<T>): Promise<T> {
      writes.inFlight += 1;
      try {
        return await write();
      } finally {
        writes.inFlight -= 1;
        writes.settledAt = Date.now();
      }
    },
  };
}

export type AllocationDialogs = ReturnType<typeof createAllocationDialogs>;

const allocationDialogsKey: InjectionKey<AllocationDialogs> =
  Symbol("allocationDialogs");

/** Creates the allocation dialogs' state for an allocations page and provides it. */
export function provideAllocationDialogs(
  view: AllocationsView,
): AllocationDialogs {
  const dialogs = createAllocationDialogs(view);
  provide(allocationDialogsKey, dialogs);
  return dialogs;
}

/** The allocation dialogs of the page's layout. */
export function useAllocationDialogs(): AllocationDialogs {
  const dialogs = inject(allocationDialogsKey);
  if (!dialogs) {
    throw new Error(
      "useAllocationDialogs() needs provideAllocationDialogs() in a parent",
    );
  }
  return dialogs;
}

/** Registers the page's data with the dialogs while the calling component lives. */
export function useAllocationsPage(page: AllocationsPage) {
  onScopeDispose(useAllocationDialogs().registerPage(page));
}
