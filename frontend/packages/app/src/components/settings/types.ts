import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type SettingsPage = "profile" | "timesheets";

export type PMSSettings = {
  auto_expand_weeks_by_default: number | null;
};

export type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type SettingsPageProps = {
  displayName: string;
  email: string;
  image: string;
  autoExpandWeeks: string;
  isLoading: boolean;
  onAutoExpandWeeksChange: (value: string) => void;
};

export type SettingsPageConfig = {
  id: SettingsPage;
  label: string;
  icon: LucideIcon;
  component: ComponentType<SettingsPageProps>;
  showSave?: boolean;
};
