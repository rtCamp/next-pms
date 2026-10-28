import { onBeforeUnmount, onMounted } from "vue";
import { useSocket } from "@/socket";

/** A realtime `list_update` event: the document and the user who changed it. */
export interface ListUpdate {
  doctype: string;
  name?: string;
  user?: string;
}

/**
 * Calls `onUpdate` whenever a document of `doctype` is created, changed or deleted, by
 * subscribing to the doctype's realtime `list_update` events while the component is
 * mounted.
 */
export function useDoctypeListUpdates(
  doctype: string,
  onUpdate: (update: ListUpdate) => void,
) {
  const socket = useSocket();

  function handle(data: Partial<ListUpdate> | undefined) {
    if (data?.doctype === doctype) onUpdate(data as ListUpdate);
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
