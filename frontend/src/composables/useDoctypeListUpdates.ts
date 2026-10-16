import { onBeforeUnmount, onMounted } from "vue";
import { useSocket } from "@/socket";

/**
 * Calls `onUpdate` whenever a document of `doctype` is created, changed or deleted, by
 * subscribing to the doctype's realtime `list_update` events while the component is
 * mounted.
 */
export function useDoctypeListUpdates(doctype: string, onUpdate: () => void) {
  const socket = useSocket();

  function handle(data: { doctype?: string }) {
    if (data?.doctype === doctype) onUpdate();
  }

  onMounted(() => {
    socket.emit("doctype_subscribe", doctype);
    socket.on("list_update", handle);
  });
  onBeforeUnmount(() => {
    socket.off("list_update", handle);
    socket.emit("doctype_unsubscribe", doctype);
  });
}
