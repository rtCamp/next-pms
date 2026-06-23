/**
 * Internal dependencies.
 */
import type { NotificationItem } from "./widget/notificationsCard";

// Hard-coded notifications from the design until real data is wired in a later issue.
export const LEADERSHIP_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    icon: "folder",
    title: "Project health update",
    body: "Orion Marketing Automation Revamp is now on track.",
    timeLabel: "32m",
  },
  {
    id: "2",
    icon: "fire",
    title: "Risk update",
    body: "Gowtham updated the risk status to Mitigated in Atlas UI Stabilisation.",
    timeLabel: "18h",
  },
  {
    id: "3",
    icon: "file",
    title: "Client feedback available",
    body: "Nov 2025 client feedback received for Nimbus Analytics Enhancement",
    timeLabel: "2d",
  },
];
