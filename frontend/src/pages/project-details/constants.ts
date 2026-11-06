/** The query param that holds the selected tab; absent for the default tab. */
export const TAB_PARAM = "tab";

/** Every tab, in React's order. `value` is the `?tab=` value. */
export const PROJECT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "calendar", label: "Calendar" },
  { value: "tracking", label: "Tracking" },
  { value: "reports", label: "Reports" },
  { value: "risks", label: "Risks" },
  { value: "growth", label: "Growth" },
  { value: "notes", label: "Notes" },
  { value: "email", label: "Email" },
  { value: "to-do", label: "ToDos" },
  { value: "feedback", label: "Feedback" },
  { value: "rag-stats", label: "RAG stats" },
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number];
export type ProjectTabKey = ProjectTab["value"];

export const DEFAULT_TAB: ProjectTabKey = "overview";
