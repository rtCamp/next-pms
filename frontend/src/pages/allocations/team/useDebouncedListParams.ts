import { onScopeDispose, shallowRef, watch } from "vue";
import { FILTER_DEBOUNCE_MS } from "@/pages/allocations/shared/constants";
import type { AllocationsParams } from "@/pages/allocations/shared/useAllocationPages";

/**
 * Whether `next` changes only the lists named in `listKeys`, none of them cleared: what
 * picking values in a list filter does.
 */
export function isListEdit(
  previous: AllocationsParams,
  next: AllocationsParams,
  listKeys: readonly string[],
) {
  let edited = false;
  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    if (previous[key] === next[key]) continue;
    if (!listKeys.includes(key) || next[key] === undefined) return false;
    edited = true;
  }
  return edited;
}

/**
 * `source`'s params, with list edits (see `isListEdit`) applied once picking pauses so
 * each pick doesn't load. Any other change applies at once, pending list edits with it.
 */
export function useDebouncedListParams(
  source: () => AllocationsParams,
  listKeys: readonly string[],
) {
  const params = shallowRef(source());
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => JSON.stringify(source()),
    () => {
      clearTimeout(timer);
      const next = source();
      if (!isListEdit(params.value, next, listKeys)) {
        params.value = next;
        return;
      }
      timer = setTimeout(() => (params.value = source()), FILTER_DEBOUNCE_MS);
    },
  );
  onScopeDispose(() => clearTimeout(timer));
  return params;
}
