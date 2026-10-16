import { createApp, type App } from "vue";
import {
  createMemoryHistory,
  createRouter,
  type RouteLocationRaw,
  type Router,
} from "vue-router";
import { socketKey } from "@/socket";

interface SetupOptions {
  /** Starts a memory router at this location before the composable runs. */
  route?: RouteLocationRaw;
  /** Values the composable can inject. */
  provide?: [key: symbol | string, value: unknown][];
}

const mounted = new Set<App>();

/**
 * Runs `composable` in the setup of a mounted app, so lifecycle hooks, provide/inject and
 * the router work. Unmount with `unmount()`, or `unmountAll()` after each test.
 */
export async function withSetup<T>(
  composable: () => T,
  options: SetupOptions = {},
) {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => null;
    },
  });
  let router: Router | undefined;
  if (options.route !== undefined) {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/:path(.*)*", component: { render: () => null } }],
    });
    app.use(router);
    await router.push(options.route);
    await router.isReady();
  }
  for (const [key, value] of options.provide ?? []) app.provide(key, value);
  app.mount(document.createElement("div"));
  mounted.add(app);
  return {
    result,
    router: router as Router,
    unmount() {
      mounted.delete(app);
      app.unmount();
    },
  };
}

export function unmountAll() {
  for (const app of mounted) app.unmount();
  mounted.clear();
}

/** A socket stand-in that records subscriptions and lets a test emit events. */
export function fakeSocket() {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  const emitted: [string, unknown][] = [];
  const socket = {
    emit: (event: string, data: unknown) => emitted.push([event, data]),
    on(event: string, listener: (data: unknown) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    off: (event: string, listener: (data: unknown) => void) =>
      listeners.get(event)?.delete(listener),
  };
  return {
    socket,
    emitted,
    provide: [socketKey, socket] as [symbol, unknown],
    /** Delivers an event the server would send. */
    receive(event: string, data: unknown) {
      for (const listener of listeners.get(event) ?? []) listener(data);
    },
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
}
