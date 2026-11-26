import type { FieldHelp } from "@/components/InfoHoverCard";
import type { NotificationEntry } from "./types";

export const NOTIFICATIONS: NotificationEntry[] = [
  {
    id: "n1",
    linkedDoctype: "Project Status Update",
    title: "You were mentioned",
    message: [
      { text: "Priya Sharma", emphasis: "strong" },
      { text: " mentioned you in " },
      { text: "Weekly update: Acme Website", emphasis: "subject" },
    ],
    timeLabel: "5m ago",
    href: "/next-pms/project/acme-website",
  },
  {
    id: "n2",
    linkedDoctype: "Risk",
    title: "New risk",
    message: [
      { text: "Rahul Verma", emphasis: "strong" },
      { text: " raised a high risk on " },
      { text: "Globex Mobile App", emphasis: "subject" },
    ],
    timeLabel: "1h ago",
    href: "/next-pms/project/globex-mobile",
  },
  {
    id: "n3",
    linkedDoctype: "Timesheet",
    title: "Timesheet rejected",
    message: [
      { text: "Your timesheet for " },
      { text: "Oct 5 - Oct 11", emphasis: "subject" },
      { text: " was rejected." },
    ],
    timeLabel: "Yesterday",
  },
  {
    id: "n4",
    linkedDoctype: "Project",
    title: "Added to project",
    message: [
      { text: "You were added to " },
      { text: "Initech Data Platform", emphasis: "subject" },
    ],
    timeLabel: "2d ago",
    read: true,
  },
  {
    id: "n5",
    linkedDoctype: "Customer Feedback",
    title: "Customer feedback",
    message: [
      { text: "Acme Corp", emphasis: "strong" },
      { text: " left feedback on the latest release." },
    ],
    timeLabel: "3d ago",
  },
  {
    id: "n6",
    linkedDoctype: "ToDo",
    message: [{ text: "A task was assigned to you." }],
    timeLabel: "1w ago",
  },
];

export const MANY_NOTIFICATIONS: NotificationEntry[] = Array.from(
  { length: 20 },
  (_, index) => ({
    ...NOTIFICATIONS[index % NOTIFICATIONS.length]!,
    id: `many-${index}`,
    read: false,
  }),
);

export const TRAY_HELP: FieldHelp = {
  title: "Notifications",
  summary: "Alerts you haven't read yet.",
  details: ["Read alerts leave the tray."],
};

export const ITEM_TOOLTIP = "Marks it read and opens the page it's about.";
