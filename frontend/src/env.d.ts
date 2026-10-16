interface Boot {
  sitename: string;
  socketio_port?: number;
  max_file_size?: number;
  time_zone?: { system?: string | null; user?: string | null };
  user?: {
    name: string;
    roles?: string[];
    /** Doctypes the user may create, e.g. `"Leave Application"`. */
    can_create?: string[];
  };
  currencies?: string[];
  sysdefaults?: { currency?: string };
  /** Server-side filters to add to lookups; `project` limits a contractor to their projects. */
  global_filters?: { project?: unknown[][] };
  [key: string]: unknown;
}

interface Window {
  /**
   * Boot data. A production build gets it from `next_pms/www/next-pms/index.py`;
   * on the dev server `loadBoot()` fetches it before the app mounts.
   */
  boot?: Boot;
  csrf_token?: string;
}
