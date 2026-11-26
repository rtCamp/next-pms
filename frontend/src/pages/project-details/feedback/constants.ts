export const FEEDBACK_API =
  "/api/v2/method/next_pms.next_projects.api.feedback";

/** The query param that holds the feedback view; absent for the client view. */
export const VIEW_PARAM = "view";

export const FEEDBACK_VIEWS = [
  { value: "client", label: "Client feedback" },
  { value: "team", label: "Team feedback" },
] as const;

export type FeedbackView = (typeof FEEDBACK_VIEWS)[number]["value"];

export const DEFAULT_VIEW: FeedbackView = "client";

export const SCHEDULE_FEEDBACK_URL = "/desk/customer-feedback-schedule/";

/** Months the timeline shows on each side of the current month, as React did. */
export const TIMELINE_SPAN_MONTHS = 60;

/** Months the timeline slides by when the user scrolls to either end. */
export const TIMELINE_STEP_MONTHS = 3;

/** The timeline endpoint returns at most `limit` schedules (18 by default); room for several a month. */
export const TIMELINE_LIMIT = 500;

export const TEAM_PAGE_SIZE = 20;

export const TEAM_COLUMNS = [
  { key: "from", label: "From", width: "88px" },
  { key: "to", label: "To", width: "88px" },
  { key: "member", label: "Member", width: "minmax(160px,auto)" },
  { key: "customer", label: "Customer", width: "minmax(160px,auto)" },
  { key: "avg_rating", label: "Avg. Rating", width: "168px" },
] as const;
