import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, nextTick, ref, type Ref } from "vue";
import type { Socket } from "socket.io-client";
import { socketKey } from "@/socket";
import { useDocUpdates, type DocUpdate } from "./useDocUpdates";

type Handler = (...args: unknown[]) => void;

/** Records what the composable emits and lets a test fire server events. */
class FakeSocket {
  connected = true;
  emitted: unknown[][] = [];
  handlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit(...args: unknown[]) {
    this.emitted.push(args);
    return this;
  }

  /** Delivers an event from the server to every handler. */
  receive(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  listenerCount(event: string) {
    return this.handlers.get(event)?.size ?? 0;
  }
}

const mounted: { unmount: () => void }[] = [];

function mountWith(
  socket: FakeSocket,
  name: Ref<string | null>,
  onUpdate: (update: DocUpdate) => void,
) {
  const app = createApp(
    defineComponent({
      setup() {
        useDocUpdates("Project", name, onUpdate);
        return () => null;
      },
    }),
  );
  app.provide(socketKey, socket as unknown as Socket);
  app.mount(document.createElement("div"));
  mounted.push(app);
  return app;
}

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
});

describe("useDocUpdates", () => {
  it("subscribes to the document on mount", () => {
    const socket = new FakeSocket();
    mountWith(socket, ref("PROJ-1"), vi.fn());
    expect(socket.emitted).toEqual([["doc_subscribe", "Project", "PROJ-1"]]);
  });

  it("calls back only for its own doctype and name", () => {
    const socket = new FakeSocket();
    const onUpdate = vi.fn();
    mountWith(socket, ref("PROJ-1"), onUpdate);

    socket.receive("doc_update", { doctype: "Task", name: "PROJ-1" });
    socket.receive("doc_update", { doctype: "Project", name: "PROJ-2" });
    socket.receive("doc_update", undefined);
    expect(onUpdate).not.toHaveBeenCalled();

    const update = {
      doctype: "Project",
      name: "PROJ-1",
      modified: "2026-10-19 10:00:00.000001",
    };
    socket.receive("doc_update", update);
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(update);
  });

  it("follows a name change", async () => {
    const socket = new FakeSocket();
    const onUpdate = vi.fn();
    const name = ref<string | null>("PROJ-1");
    mountWith(socket, name, onUpdate);
    socket.emitted = [];

    name.value = "PROJ-2";
    await nextTick();
    expect(socket.emitted).toEqual([
      ["doc_unsubscribe", "Project", "PROJ-1"],
      ["doc_subscribe", "Project", "PROJ-2"],
    ]);

    socket.receive("doc_update", { doctype: "Project", name: "PROJ-1" });
    expect(onUpdate).not.toHaveBeenCalled();
    socket.receive("doc_update", { doctype: "Project", name: "PROJ-2" });
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("does nothing without a name", async () => {
    const socket = new FakeSocket();
    const onUpdate = vi.fn();
    const name = ref<string | null>(null);
    mountWith(socket, name, onUpdate);
    expect(socket.emitted).toEqual([]);

    socket.receive("doc_update", { doctype: "Project", name: "" });
    expect(onUpdate).not.toHaveBeenCalled();

    name.value = "PROJ-1";
    await nextTick();
    expect(socket.emitted).toEqual([["doc_subscribe", "Project", "PROJ-1"]]);
  });

  it("subscribes again when the socket reconnects", () => {
    const socket = new FakeSocket();
    mountWith(socket, ref("PROJ-1"), vi.fn());
    socket.emitted = [];

    socket.connected = false;
    socket.receive("disconnect");
    socket.connected = true;
    socket.receive("connect");
    expect(socket.emitted).toEqual([["doc_subscribe", "Project", "PROJ-1"]]);
  });

  it("waits for the connection before subscribing", () => {
    const socket = new FakeSocket();
    socket.connected = false;
    mountWith(socket, ref("PROJ-1"), vi.fn());
    expect(socket.emitted).toEqual([]);

    socket.connected = true;
    socket.receive("connect");
    expect(socket.emitted).toEqual([["doc_subscribe", "Project", "PROJ-1"]]);
  });

  it("unsubscribes on unmount and removes only its own handlers", () => {
    const socket = new FakeSocket();
    const other = vi.fn();
    socket.on("doc_update", other);
    const onUpdate = vi.fn();
    const app = mountWith(socket, ref("PROJ-1"), onUpdate);
    socket.emitted = [];

    app.unmount();
    mounted.splice(mounted.indexOf(app), 1);
    expect(socket.emitted).toEqual([["doc_unsubscribe", "Project", "PROJ-1"]]);
    expect(socket.listenerCount("doc_update")).toBe(1);
    expect(socket.listenerCount("connect")).toBe(0);

    socket.receive("doc_update", { doctype: "Project", name: "PROJ-1" });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(other).toHaveBeenCalledOnce();
  });

  it("never emits doc_open or doc_close", async () => {
    const socket = new FakeSocket();
    const name = ref<string | null>("PROJ-1");
    const app = mountWith(socket, name, vi.fn());
    name.value = "PROJ-2";
    await nextTick();
    app.unmount();
    mounted.splice(mounted.indexOf(app), 1);
    const events = socket.emitted.map(([event]) => event);
    expect(events).not.toContain("doc_open");
    expect(events).not.toContain("doc_close");
  });
});
