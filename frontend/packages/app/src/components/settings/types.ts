import type { LucideIcon } from "lucide-react";

export type SettingsPage = "profile" | "timesheets";

export type PMSSettings = {
  auto_expand_weeks_by_default: number | null;
  system_auto_expand_weeks_by_default: number;
  use_system_auto_expand_weeks: 0 | 1;
};

export type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ProfilePageProps = {
  displayName: string;
  email: string;
  image: string;
};

export type TimesheetsPageProps = {
  autoExpandWeeks: string;
  useSystemAutoExpandWeeks: boolean;
  isLoading: boolean;
  onAutoExpandWeeksChange: (value: string) => void;
  onUseSystemAutoExpandWeeksChange: (value: boolean) => void;
};

export type SettingsPageConfig = {
  id: SettingsPage;
  label: string;
  icon: LucideIcon;
  showSave?: boolean;
};
