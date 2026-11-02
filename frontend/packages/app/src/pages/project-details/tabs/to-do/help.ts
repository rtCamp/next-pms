/**
 * Internal dependencies.
 */
import type { LinkedRecord, LinkedRecordType } from "./types";

export const STATUS_TOOLTIP = {
  close: (status: string) => `Status: ${status}. Select to close it.`,
  reopen: "Status: Closed. Select to reopen it.",
};

export const LINKED_CHIP_TOOLTIP: Record<LinkedRecordType, string> = {
  Milestone:
    "Linked to this milestone. Select to find it in the Milestones list on the Calendar tab.",
  Touchpoint:
    "Linked to this touchpoint. Select to find it in the Touchpoints list on the Calendar tab.",
  "Growth Initiative":
    "Linked to this growth initiative. Select to open it in the Growth tab.",
};

export const UNLINK_TOOLTIP = (record: LinkedRecord) =>
  `You need edit access to the ${record.type.toLowerCase()} "${record.title}" to unlink this ToDo.`;
