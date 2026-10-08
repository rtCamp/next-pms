/**
 * External dependencies.
 */
import { Leaf, Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { LinkedRecordType } from "./types";

export const TODO_API = "next_pms.next_projects.api.todo";

export const LINKED_RECORD_ICON: Record<LinkedRecordType, typeof Sparkle> = {
  Milestone: Sparkle,
  Touchpoint: Zap,
  "Growth Initiative": Leaf,
};

export const LINKED_RECORD_GROUPS: { type: LinkedRecordType; label: string }[] =
  [
    { type: "Milestone", label: "Milestones" },
    { type: "Touchpoint", label: "Touchpoints" },
    { type: "Growth Initiative", label: "Growth initiatives" },
  ];
