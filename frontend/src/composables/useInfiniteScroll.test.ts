import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { unmountAll, withSetup } from "@/test/withSetup";
import { useInfiniteScroll } from "./useInfiniteScroll";

const ROW_HEIGHT = 40;

/** A 200px scroll area with `rows` rows and a sentinel after them. */
function scrollArea(rows: number) {
  const root = document.createElement("div");
  root.style.cssText = "height: 200px; overflow: auto;";
  const list = document.createElement("div");
  const sentinel = document.createElement("div");
  root.append(list, sentinel);
  document.body.append(root);
  const setRows = (count: number) => {
    list.style.height = `${count * ROW_HEIGHT}px`;
  };
  setRows(rows);
  return { root, sentinel, setRows };
}

afterEach(() => {
  unmountAll();
  document.body.replaceChildren();
});

async function setup(initialRows: number, canLoad = () => true) {
  const area = scrollArea(initialRows);
  const count = ref(initialRows);
  const load = vi.fn();
  await withSetup(() =>
    useInfiniteScroll({
      root: ref(area.root),
      sentinel: ref(area.sentinel),
      count: () => count.value,
      canLoad,
      load,
    }),
  );
  return { ...area, count, load };
}

describe("useInfiniteScroll", () => {
  it("loads when the sentinel is within 200px of the bottom", async () => {
    const { load } = await setup(8); // 320px of rows: sentinel 120px below
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
  });

  it("doesn't load while the sentinel is far below", async () => {
    const { root, load } = await setup(50); // 2000px of rows
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(load).not.toHaveBeenCalled();

    root.scrollTop = 2000;
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
  });

  it("doesn't load while it can't", async () => {
    const allowed = ref(false);
    const { load } = await setup(2, () => allowed.value);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(load).not.toHaveBeenCalled();

    allowed.value = true;
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
  });

  it("loads again after a page that leaves the sentinel visible", async () => {
    const { load, count, setRows } = await setup(2);
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());

    setRows(4);
    count.value = 4;
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });

  it("stops after a page that pushes the sentinel out of reach", async () => {
    const { load, count, setRows } = await setup(2);
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());

    setRows(50);
    count.value = 50;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(load).toHaveBeenCalledOnce();
  });
});
