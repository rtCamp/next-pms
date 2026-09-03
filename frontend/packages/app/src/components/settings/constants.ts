import { Clock, User } from "lucide-react";

import type { SettingsPageConfig } from "./types";

export const USER_CONFIGURATION_PAGES: SettingsPageConfig[] = [
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
];
