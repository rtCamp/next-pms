import { Clock, User } from "lucide-react";

import { ProfilePage } from "./pages/profile";
import { TimesheetsPage } from "./pages/timesheets";
import type { SettingsPageConfig } from "./types";

export const USER_CONFIGURATION_PAGES: SettingsPageConfig[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    component: ProfilePage,
  },
  {
    id: "timesheets",
    label: "Timesheets",
    icon: Clock,
    component: TimesheetsPage,
    showSave: true,
  },
];
