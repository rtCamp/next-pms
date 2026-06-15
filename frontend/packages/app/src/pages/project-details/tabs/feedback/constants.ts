export const FEEDBACK_LIST_COLUMNS = [
  { key: "from", label: "From", width: "88px" },
  { key: "to", label: "To", width: "88px" },
  { key: "member", label: "Member", width: "minmax(160px, auto)" },
  { key: "customer", label: "Customer", width: "minmax(160px, auto)" },
  { key: "avg_rating", label: "Avg. Rating", width: "168px" },
] as const;

export const FEEDBACK_VIEW_PARAM = "view";
