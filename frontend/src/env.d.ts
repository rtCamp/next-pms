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
  /** Whether the user's Google Calendar is connected. */
  is_calendar_setup?: boolean;
  /** Whether the customer feedback app is installed; shows a project's Feedback tab. */
  has_customer_feedback?: boolean;
  /** Whether the rtcamp app is installed; shows a project's RAG stats tab. */
  show_rag_trigger_page?: boolean;
  /** Whether the ToDo doctype has the rtcamp title, start and end fields. */
  has_todo_custom_fields?: boolean;
  /** Whether the GitHub Repository doctype exists; shows a project's repository connections. */
  has_repository_connections?: boolean;
  /**
   * Which Project fields from other apps exist on this site, by fieldname, e.g.
   * `{ custom_source: true }`. Read it through `hasProjectField()`.
   */
  optional_project_fields?: Record<string, boolean>;
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
