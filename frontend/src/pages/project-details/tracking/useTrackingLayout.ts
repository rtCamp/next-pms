import { computed, ref, type Ref } from "vue";
import { toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { VIEW_API } from "./constants";
import { parseStoredLayout } from "./layout";
import type { StoredView, TrackingLayout } from "./types";

/**
 * The project's shared tracking layout: one public `PMS View Setting` row of type
 * Tracking, created on the first save.
 */
export function useTrackingLayout(projectId: Readonly<Ref<string>>) {
  const viewCall = useCall<StoredView[], { dt: string; project: string }>({
    url: `${VIEW_API}.get_view`,
    params: () => ({ dt: "Project", project: projectId.value }),
    refetch: true,
  });
  const createCall = useCall<unknown, { view: Record<string, unknown> }>({
    url: `${VIEW_API}.create_view`,
    method: "POST",
    immediate: false,
  });
  const updateCall = useCall<unknown, { view: Record<string, unknown> }>({
    url: `${VIEW_API}.update_view`,
    method: "POST",
    immediate: false,
  });

  const storedView = computed(() => viewCall.data?.[0]);
  // A failed read falls back to the default layout.
  const storedLayout = computed(() =>
    storedView.value ? parseStoredLayout(storedView.value.rows) : null,
  );
  const saving = ref(false);

  /** Saves `layout`; resolves to whether it saved. */
  async function save(layout: TrackingLayout): Promise<boolean> {
    saving.value = true;
    try {
      const view = storedView.value;
      if (view) {
        await updateCall.submit({ view: { name: view.name, rows: layout } });
      } else {
        await createCall.submit({
          view: {
            dt: "Project",
            type: "Tracking",
            project: projectId.value,
            label: `Tracking layout: ${projectId.value}`,
            public: 1,
            rows: layout,
          },
        });
      }
      await viewCall.reload();
      toast.success("Tracking layout updated");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    storedLayout,
    loading: computed(
      () => viewCall.loading && !viewCall.data && !viewCall.error,
    ),
    saving,
    save,
  };
}
