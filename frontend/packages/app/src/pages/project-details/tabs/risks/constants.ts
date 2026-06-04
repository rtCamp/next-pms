/**
 * External dependencies.
 */
import { Kanban, AlignLeft } from "@rtcamp/frappe-ui-react/icons";

export const RISK_VIEWS = [
  { key: "list", label: "List view", icon: AlignLeft },
  { key: "kanban", label: "Kanban view", icon: Kanban },
] as const;

export type RiskViewKey = (typeof RISK_VIEWS)[number]["key"];

export const RISK_VIEW_PARAM = "view";
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

export const RISK_LIST_COLUMNS = [
  { key: "risk_category", label: "Risk category", width: "128px", flex: 1 },
  { key: "summary", label: "Risk Summary", width: "264px", flex: 4 },
  { key: "owner", label: "Owner", width: "140px", flex: 0 },
  { key: "risk_level", label: "Risk level", width: "74px", flex: 0 },
  { key: "status", label: "Status", width: "120px", flex: 1 },
] as const;
