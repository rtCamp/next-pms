import { ref, watch, type Ref } from "vue";

function readSaved<T>(key: string, fallback: () => T): T {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback();
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback();
  }
}

/**
 * A ref kept in `localStorage` under `key` as JSON, the format the React app's
 * `useSavedState` wrote, so values saved there carry over. `initial` is used when the
 * key is missing or holds something unparseable.
 */
export function useSavedState<T>(key: string, initial: T | (() => T)): Ref<T> {
  const fallback = () =>
    typeof initial === "function" ? (initial as () => T)() : initial;
  const state = ref(readSaved(key, fallback)) as Ref<T>;
  watch(state, (value) => localStorage.setItem(key, JSON.stringify(value)), {
    deep: true,
    immediate: true,
  });
  return state;
}
