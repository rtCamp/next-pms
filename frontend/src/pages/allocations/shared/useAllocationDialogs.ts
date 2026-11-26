import {
  inject,
  onScopeDispose,
  provide,
  reactive,
  shallowRef,
  type InjectionKey,
} from "vue";
import { dialog, toast, useCall } from "frappe-ui";
import type {
  AllocationEventData,
  AllocationSummaryText,
  DeleteAllocationMode,
} from "@/components/GanttGrid";
import { errorMessage } from "@/utils/errors";
import type { EditScheduleRequest } from "./allocationForm";
import type { AllocationsView } from "./constants";
import {
  DELETE_MODE_OPTIONS,
  deleteMessage,
  deleteSummary,
} from "./deleteAllocation";
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

/** The Add / Edit dialog's first three fields, in each page's order. */
const FIELD_ORDER = {
  team: ["employee", "project", "customer"],
  project: ["project", "customer", "employee"],
} as const satisfies Record<AllocationsView, readonly string[]>;

function createAllocationDialogs(view: AllocationsView) {
  const page = shallowRef<AllocationsPage | null>(null);
  const form = reactive({
    open: false,
    request: null as AllocationFormRequest | null,
  });
  const schedule = reactive({
    open: false,
    request: null as EditScheduleRequest | null,
  });
  /** The page's own writes: realtime updates they cause are not loaded twice. */
  const writes = reactive({ inFlight: 0, settledAt: 0 });

  const deleteCall = useCall<
    unknown,
    { name: string; delete_mode: DeleteAllocationMode }
  >({
    url: "/api/v2/method/next_pms.resource_management.api.allocation.delete_allocation",
    method: "POST",
    immediate: false,
  });

  async function runWrite<T>(write: () => Promise<T>): Promise<T> {
    writes.inFlight += 1;
    try {
      return await write();
    } finally {
      writes.inFlight -= 1;
      writes.settledAt = Date.now();
    }
  }

  function refresh(targets?: AllocationRefreshTargets) {
    return page.value?.refresh(targets) ?? Promise.resolve();
  }

  /**
   * Asks before deleting an allocation, with a mode for a recurring one. A failed delete
   * shows the server's message in the dialog, which stays open.
   */
  function confirmDelete(
    data: AllocationEventData,
    summary?: AllocationSummaryText,
    onDeleted?: () => void,
  ) {
    const allocationId = data.allocationId;
    if (!allocationId) {
      toast.error("Allocation ID not found");
      return;
    }
    const remove = (mode: DeleteAllocationMode) =>
      runWrite(async () => {
        try {
          await deleteCall.submit({ name: allocationId, delete_mode: mode });
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("The allocation has been deleted successfully");
        onDeleted?.();
        await refresh({
          ...(data.employeeId ? { employeeIds: [data.employeeId] } : {}),
          ...(data.projectId ? { projectIds: [data.projectId] } : {}),
        });
      });
    const common = {
      title: "Delete Allocation",
      message: deleteMessage(deleteSummary(data, summary)),
      confirmLabel: "Delete",
      size: "lg" as const,
    };
    if (!data.recurrenceId) {
      dialog.danger({ ...common, onConfirm: () => remove("only_this") });
      return;
    }
    dialog.prompt({
      ...common,
      theme: "red",
      icon: "lucide-triangle-alert",
      fields: [
        {
          name: "mode",
          type: "select",
          label: "Apply delete to",
          required: true,
          defaultValue: "only_this",
          options: DELETE_MODE_OPTIONS,
        },
      ],
      onConfirm: ({ values }) => remove(values.mode as DeleteAllocationMode),
    });
  }

  function openForm(
    mode: AllocationFormRequest["mode"],
    data: AllocationEventData,
  ) {
    form.request = { mode, data, customerId: page.value?.customerIdFor(data) };
    form.open = true;
  }

  return {
    view,
    fieldOrder: FIELD_ORDER[view],
    form,
    schedule,
    writes,
    openAdd: (data: AllocationEventData = {}) => openForm("add", data),
    openEdit: (data: AllocationEventData) => openForm("edit", data),
    /** Swaps the Add / Edit dialog for Edit schedule. */
    openEditSchedule(request: EditScheduleRequest) {
      form.open = false;
      schedule.request = request;
      schedule.open = true;
    },
    /** Lets the page's data take part; returns its unregister. */
    registerPage(next: AllocationsPage) {
      page.value = next;
      return () => {
        if (page.value === next) page.value = null;
      };
    },
    refresh,
    /** Runs one of the page's writes, with the refresh that follows it. */
    runWrite,
    confirmDelete,
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
