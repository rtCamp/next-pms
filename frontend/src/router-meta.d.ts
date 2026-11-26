import "vue-router";
import type { Capability } from "./session";

declare module "vue-router" {
  interface RouteMeta {
    /** Shown in the browser tab as "<title> | Next PMS". */
    title?: string;
    /** The capability needed to open the route. Unset means everyone. */
    capability?: Capability;
    /** A status page: rendered without the sidebar and skipped by the guards. */
    standalone?: boolean;
    /**
     * `false` when the page scrolls its own panes, e.g. a list whose header stays
     * put; the shell then doesn't scroll the page.
     */
    scroll?: false;
  }
}
