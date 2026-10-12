import { useRouter, type LocationQuery } from "vue-router";

type QueryPatch = Record<string, string | null | undefined>;

// Patches made in the same tick are merged into one navigation. Each one reading
// `route.query` on its own would only see the query from before the earlier patches.
let pending: QueryPatch | null = null;

/**
 * Returns `patchQuery(patch)`, which sets query params on the current route with
 * `router.replace` (no history entry). An empty, `null` or `undefined` value removes the
 * param.
 */
export function useQueryPatch() {
  const router = useRouter();

  return function patchQuery(patch: QueryPatch) {
    if (!pending) {
      pending = {};
      queueMicrotask(() => {
        const merged: LocationQuery = { ...router.currentRoute.value.query };
        for (const [key, value] of Object.entries(pending ?? {})) {
          if (value) merged[key] = value;
          else delete merged[key];
        }
        pending = null;
        router.replace({ query: merged, hash: router.currentRoute.value.hash });
      });
    }
    Object.assign(pending, patch);
  };
}
