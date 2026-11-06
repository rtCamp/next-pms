import { useRouter, type RouteLocationRaw } from "vue-router";

type Loader = () => Promise<unknown>;

// Loaders already called. The router swaps a lazy component for the loaded one
// only when it navigates there, so a hovered link would load again without this.
const started = new WeakSet<Loader>();

/**
 * Returns a function that loads a route's page code ahead of a click, as React's
 * `LinkWithPreload` did for the sidebar links. Loads code only, never data.
 */
export function usePreloadRoute() {
  const router = useRouter();

  return (to: RouteLocationRaw) => {
    for (const record of router.resolve(to).matched) {
      const component = record.components?.default;
      // A lazy route's component is its loader; a loaded one is an object.
      if (typeof component !== "function") continue;
      const load = component as Loader;
      if (started.has(load)) continue;
      started.add(load);
      // A failed load (e.g. offline) may be tried again on the next hover.
      load().catch(() => started.delete(load));
    }
  };
}
