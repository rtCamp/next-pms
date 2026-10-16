import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { toast } from "frappe-ui";
import { ApiError, deferred, mockApi } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import { isLikedBy, useToggleLike } from "./useToggleLike";

const TOGGLE = "frappe.desk.like.toggle_like";

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("useToggleLike", () => {
  it("flips at once and sends the new state", async () => {
    const response = deferred();
    const api = mockApi({ [TOGGLE]: () => response.promise });
    const onToggled = vi.fn();
    const { result } = await withSetup(() =>
      useToggleLike({ doctype: "Task", name: "T-1", liked: false, onToggled }),
    );

    const toggling = result.toggle();
    expect(result.liked).toBe(true);
    await vi.waitFor(() => expect(result.isToggling).toBe(true));
    expect(onToggled).not.toHaveBeenCalled();

    response.resolve(null);
    await toggling;
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      params: { doctype: "Task", name: "T-1", add: "Yes" },
    });
    expect(onToggled).toHaveBeenCalledWith(true);
    expect(result.isToggling).toBe(false);
  });

  it("sends add: No when unstarring", async () => {
    const api = mockApi({ [TOGGLE]: () => null });
    const name = ref("T-2");
    const { result } = await withSetup(() =>
      useToggleLike({ doctype: "Task", name, liked: true }),
    );
    await result.toggle();
    expect(result.liked).toBe(false);
    expect(api.requests[0].params).toMatchObject({ name: "T-2", add: "No" });
  });

  it("follows the server's liked state", async () => {
    const liked = ref(false);
    const { result } = await withSetup(() =>
      useToggleLike({ doctype: "Task", name: "T-1", liked }),
    );
    liked.value = true;
    await nextTick();
    expect(result.liked).toBe(true);
  });

  it("reverts and shows an error toast when the request fails", async () => {
    mockApi({ [TOGGLE]: () => new ApiError("Not permitted") });
    const errorToast = vi.spyOn(toast, "error").mockImplementation(() => "");
    const onToggled = vi.fn();
    const { result } = await withSetup(() =>
      useToggleLike({ doctype: "Task", name: "T-1", liked: false, onToggled }),
    );
    await result.toggle();
    expect(result.liked).toBe(false);
    expect(errorToast).toHaveBeenCalledWith("Not permitted");
    expect(onToggled).not.toHaveBeenCalled();
  });
});

describe("isLikedBy", () => {
  it("finds the user in the _liked_by array", () => {
    expect(isLikedBy('["a@x.com","b@x.com"]', "b@x.com")).toBe(true);
    expect(isLikedBy('["a@x.com"]', "b@x.com")).toBe(false);
  });

  it.each([null, undefined, "", "not json", '{"a":1}'])(
    "is false for %j",
    (value) => {
      expect(isLikedBy(value, "a@x.com")).toBe(false);
    },
  );
});
