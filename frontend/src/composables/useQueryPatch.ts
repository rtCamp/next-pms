import { useRouter, type LocationQuery } from "vue-router";

type QueryPatch = Record<string, string | null | undefined>;

// Patches made in the same tick are merged into one navigation, and each navigation
// waits for the one before it: `route.query` only changes once a navigation ends, so
// a patch merged earlier would start from the query before the previous patch.
let pending: QueryPatch | null = null;
let pendingPush = false;
let lastNavigation: Promise<unknown> = Promise.resolve();

/**
 * Returns `patchQuery(patch, options)`, which sets query params on the current route
 * with `router.replace` (no history entry), or `router.push` when `options.push` is set.
 * An empty, `null` or `undefined` value removes the param.
 */
export function useQueryPatch() {
  const router = useRouter();

  function flush() {
    const merged: LocationQuery = { ...router.currentRoute.value.query };
    for (const [key, value] of Object.entries(pending ?? {})) {
      if (value) merged[key] = value;
      else delete merged[key];
    }
    const push = pendingPush;
    pending = null;
    pendingPush = false;
    const location = { query: merged, hash: router.currentRoute.value.hash };
    return push ? router.push(location) : router.replace(location);
  }

  return function patchQuery(patch: QueryPatch, options?: { push?: boolean }) {
    if (!pending) {
      pending = {};
      // A failed navigation must not stop the patches queued after it.
      lastNavigation = lastNavigation.catch(() => undefined).then(flush);
    }
    Object.assign(pending, patch);
    if (options?.push) pendingPush = true;
  };
}
