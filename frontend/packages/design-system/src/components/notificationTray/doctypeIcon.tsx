/**
 * External dependencies.
 */
import type { ComponentType } from "react";
import {
  AtSign,
  Calendar,
  Check,
  File,
  Fire,
  Folder,
  Time,
} from "@rtcamp/frappe-ui-react/icons";

const DOCTYPE_ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  Risk: Fire,
  Timesheet: Time,
  "Customer Feedback": File,
  Project: Folder,
  "Project Status Update": AtSign,
  "Project RAG Status": AtSign,
  "Leave Application": Calendar,
};

const NotificationIcon = ({
  linkedDoctype,
  title,
}: {
  linkedDoctype: string;
  title?: string;
}) => {
  const Icon = title?.toLowerCase().includes("mention")
    ? AtSign
    : (DOCTYPE_ICON_MAP[linkedDoctype] ?? Check);
  return (
    <div
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2"
    >
      <Icon size={18} />
    </div>
  );
};

export default NotificationIcon;
