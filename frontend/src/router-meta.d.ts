import "vue-router";
import type { Role } from "./session";

declare module "vue-router" {
  interface RouteMeta {
    /** Shown in the browser tab as "<title> | Next PMS". */
    title?: string;
    /** Roles that may open the route; any one is enough. Unset means everyone. */
    roles?: readonly Role[];
    /** A status page: rendered without the sidebar and skipped by the guards. */
    standalone?: boolean;
    /**
     * `false` when the page scrolls its own panes, e.g. a list whose header stays
     * put; the shell then doesn't scroll the page.
     */
    scroll?: false;
  }
}
