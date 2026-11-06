import {
  onBeforeUnmount,
  onMounted,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type WatchStopHandle,
} from "vue";
import { useSocket } from "@/socket";

/** The payload of Frappe's realtime `doc_update` event. */
export interface DocUpdate {
  doctype: string;
  name: string;
  /** The saved document's `modified`, in the server's format. */
  modified?: string;
}

/**
 * Calls `onUpdate` whenever the document `doctype` / `name` is saved, by subscribing
 * to its realtime `doc_update` events while the component is mounted. Follows `name`
 * when it changes, and subscribes again after the socket reconnects.
 */
export function useDocUpdates(
  doctype: string,
  name: MaybeRefOrGetter<string | null | undefined>,
  onUpdate: (update: DocUpdate) => void,
) {
  const socket = useSocket();
  let subscribedName: string | null = null;
  let stopWatch: WatchStopHandle | undefined;

  function subscribe() {
    if (subscribedName && socket.connected) {
      socket.emit("doc_subscribe", doctype, subscribedName);
    }
  }

  function unsubscribe() {
    if (subscribedName) {
      socket.emit("doc_unsubscribe", doctype, subscribedName);
    }
    subscribedName = null;
  }

  function handleUpdate(data: Partial<DocUpdate> | undefined) {
    if (
      subscribedName &&
      data?.doctype === doctype &&
      data.name === subscribedName
    ) {
      onUpdate(data as DocUpdate);
    }
  }

  onMounted(() => {
    socket.on("doc_update", handleUpdate);
    // Fires on every (re)connection; the server forgets rooms on disconnect.
    socket.on("connect", subscribe);
    stopWatch = watch(
      () => toValue(name) || null,
      (next) => {
        unsubscribe();
        subscribedName = next;
        subscribe();
      },
      { immediate: true },
    );
  });

  onBeforeUnmount(() => {
    stopWatch?.();
    socket.off("doc_update", handleUpdate);
    socket.off("connect", subscribe);
    unsubscribe();
  });
}
