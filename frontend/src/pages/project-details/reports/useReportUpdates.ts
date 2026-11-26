import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";
import { toast } from "frappe-ui";
import { useSocket } from "@/socket";
import { REPORT_POLL_MS } from "./constants";

interface PmReportReadyEvent {
  project?: string;
  doc_link?: string;
  error?: string;
  run_id?: string;
  status?: string;
}

/**
 * Reloads the project when its report finishes (`pm_report_ready`, sent to the user
 * who asked for it), and every 30s while a report is generating.
 */
export function useReportUpdates(options: {
  projectId: Readonly<Ref<string>>;
  generating: Readonly<Ref<boolean>>;
  reload: () => unknown;
}) {
  const socket = useSocket();

  function handleReady(data: PmReportReadyEvent | undefined) {
    if (data?.project !== options.projectId.value) return;
    options.reload();
    if (data.doc_link) toast.success("Project report generated successfully!");
    else if (data.error) toast.error(data.error);
  }

  onMounted(() => socket.on("pm_report_ready", handleReady));
  onBeforeUnmount(() => socket.off("pm_report_ready", handleReady));

  let timer: ReturnType<typeof setInterval> | undefined;
  watch(
    () => options.generating.value,
    (generating) => {
      clearInterval(timer);
      if (generating) timer = setInterval(options.reload, REPORT_POLL_MS);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => clearInterval(timer));
}
