/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

export const REPORT_HELP: FieldHelp = {
  title: "Project report",
  summary:
    "Generate Project Report creates a Google Doc that sums up the project over the Report Duration, saved in the Report Drive Link folder.",
  details: [
    "It draws on the Slack Channel, the selected GitHub repository and board, and the billable hours logged on each task in that period.",
    "It needs a Slack Channel and a Report Drive Link. The Drive link is set as Google Drive Folder Link on the project's form in Desk.",
    "You get a notification when the report is ready or if it fails.",
  ],
  wiki: "Reports#generate-a-project-report",
};

export const RESYNC_TOOLTIP =
  "Reloads the list to show the latest status. It also updates on its own while a report is generating.";
