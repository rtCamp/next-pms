import { effectScope, nextTick, shallowRef, watch } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILTER_DEBOUNCE_MS } from "@/pages/allocations/shared/constants";
import type { AllocationsParams } from "@/pages/allocations/shared/useAllocationPages";
import { isListEdit, useDebouncedListParams } from "./useDebouncedListParams";

const LISTS = ["designation", "department"];

describe("isListEdit", () => {
  it("is true when only a list changes", () => {
    expect(
      isListEdit(
        { search: "a" },
        { search: "a", designation: '["QA"]' },
        LISTS,
      ),
    ).toBe(true);
  });

  it("is false when a list is cleared", () => {
    expect(
      isListEdit({ designation: '["QA"]' }, { designation: undefined }, LISTS),
    ).toBe(false);
  });

  it("is false when another param changes too", () => {
    expect(
      isListEdit(
        { search: "a" },
        { search: "b", designation: '["QA"]' },
        LISTS,
      ),
    ).toBe(false);
  });

  it("is false when nothing changes", () => {
    expect(isListEdit({ search: "a" }, { search: "a" }, LISTS)).toBe(false);
  });
});

describe("useDebouncedListParams", () => {
  const source = shallowRef<AllocationsParams>({});
  let applied: AllocationsParams[];
  let stop: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    source.value = { search: "a", designation: '["QA"]' };
    const scope = effectScope();
    applied = [];
    scope.run(() => {
      const params = useDebouncedListParams(() => source.value, LISTS);
      watch(params, (value) => applied.push(value));
    });
    stop = () => scope.stop();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("applies a list edit once picking pauses", async () => {
    source.value = { search: "a", designation: '["Dev","QA"]' };
    await nextTick();
    expect(applied).toEqual([]);
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    await nextTick();
    expect(applied).toEqual([{ search: "a", designation: '["Dev","QA"]' }]);
  });

  it("applies Clear all at once, in one change", async () => {
    source.value = { search: "", designation: undefined };
    await nextTick();
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    await nextTick();
    expect(applied).toEqual([{ search: "", designation: undefined }]);
  });

  it("applies a pending list edit with the next other change", async () => {
    source.value = { search: "a", designation: '["Dev","QA"]' };
    await nextTick();
    source.value = { search: "b", designation: '["Dev","QA"]' };
    await nextTick();
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    await nextTick();
    expect(applied).toEqual([{ search: "b", designation: '["Dev","QA"]' }]);
  });
});
