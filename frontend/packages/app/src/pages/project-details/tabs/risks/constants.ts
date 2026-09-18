export const RISK_DETAIL_PARAM = "risk";

export const RISK_STATUSES = [
  "To-do",
  "In Progress",
  "Escalated",
  "Blocked",
  "Mitigated",
] as const;

export const RISK_LEVELS = ["Low", "Medium", "High"] as const;

export type RiskStatus = (typeof RISK_STATUSES)[number];

export const CREATE_RISK_ROLES = [
  "Projects Manager",
  "Delivery Manager",
  "Delivery User",
] as const;

export const MANAGE_ALL_RISK_ROLES = [
  "System Manager",
  ...CREATE_RISK_ROLES,
] as const;

export const RISK_OWNER_GATED_ROLES = [
  "Timesheet Manager",
  "Projects User",
] as const;

export const RISK_LIST_COLUMNS = [
  { key: "risk_category", label: "Risk category", width: "128px", flex: 1 },
  { key: "summary", label: "Risk Summary", width: "264px", flex: 4 },
  { key: "risk_owner", label: "Risk owner", width: "140px", flex: 0 },
  { key: "risk_level", label: "Risk level", width: "74px", flex: 0 },
  { key: "status", label: "Status", width: "120px", flex: 1 },
] as const;
