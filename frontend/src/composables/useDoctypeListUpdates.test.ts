import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeSocket, unmountAll, withSetup } from "@/test/withSetup";
import { useDoctypeListUpdates } from "./useDoctypeListUpdates";

afterEach(unmountAll);

describe("useDoctypeListUpdates", () => {
  it("subscribes while mounted and calls back for its doctype only", async () => {
    const socket = fakeSocket();
    const onUpdate = vi.fn();
    const { unmount } = await withSetup(
      () => useDoctypeListUpdates("Project", onUpdate),
      { provide: [socket.provide] },
    );
    expect(socket.emitted).toEqual([["doctype_subscribe", "Project"]]);

    socket.receive("list_update", { doctype: "Task" });
    socket.receive("list_update", {});
    expect(onUpdate).not.toHaveBeenCalled();
    socket.receive("list_update", { doctype: "Project", name: "P-1" });
    expect(onUpdate).toHaveBeenCalledOnce();

    unmount();
    expect(socket.emitted.at(-1)).toEqual(["doctype_unsubscribe", "Project"]);
    expect(socket.listenerCount("list_update")).toBe(0);
  });
});
