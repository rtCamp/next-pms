import { Clock, User, Users } from "lucide-react";

import type { SettingsSection } from "./types";

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    label: "User Configuration",
    tabs: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
      },
      {
        id: "timesheets",
        label: "Timesheets",
        icon: Clock,
        showSave: true,
      },
    ],
  },
  {
    label: "System Configuration",
    tabs: [
      {
        id: "system-timesheets",
        label: "Timesheets",
        icon: Clock,
        showSave: true,
      },
      {
        id: "system-resource-management",
        label: "Resource Management",
        icon: Users,
        showSave: true,
      },
    ],
  },
];

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
