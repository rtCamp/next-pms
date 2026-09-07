import type { LucideIcon } from "lucide-react";

export type SettingsPage =
  "profile" | "timesheets" | "system-timesheets" | "system-resource-management";

export type SettingsTab = {
  id: SettingsPage;
  label: string;
  icon: LucideIcon;
  showSave?: boolean;
};

export type SettingsSection = {
  label: string;
  tabs: SettingsTab[];
};

export type PMSSettings = {
  auto_expand_weeks_by_default: number | null;
  system_auto_expand_weeks_by_default: number;
  use_system_auto_expand_weeks: 0 | 1;
};

export type TimesheetSettings = {
  allow_backdated_entries?: 0 | 1;
  allow_backdated_entries_till_employee?: number;
  allow_backdated_entries_till_manager?: number;
  ignored_role?: Array<{ role?: string }>;
  allow_future_entries?: 0 | 1;
  allow_weekend_entries?: 0 | 1;
  auto_expand_weeks_by_default?: number;
  send_daily_reminder?: 0 | 1;
  daily_reminder_template?: string | null;
  send_reminder_on_approval_request?: 0 | 1;
  approval_request_reminder_template?: string | null;
  timesheet_approval_template?: string | null;
  timesheet_rejection_template?: string | null;
  send_weekly_approval_reminder?: 0 | 1;
  day_to_send_reminder?: string;
  weekly_approval_reminder_template?: string | null;
  allowed_departments?: Array<{ department?: string }>;
};

export type ResourceManagementSettings = {
  send_missing_allocation_reminder?: 0 | 1;
  remind_on?: string;
  allocation_email_template?: string | null;
  designations?: Array<{ designation?: string }>;
  default_currency?: string | null;
};

export type SystemSettings = TimesheetSettings &
  ResourceManagementSettings & {
    name: string;
  };

export type FieldUpdater<T> = <K extends keyof T>(
  field: K,
  value: T[K],
) => void;

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
  systemAutoExpandWeeks: number | undefined;
  useSystemAutoExpandWeeks: boolean;
  onAutoExpandWeeksChange: (value: string) => void;
  onUseSystemAutoExpandWeeksChange: (value: boolean) => void;
};

export type SystemTimesheetsPageProps = {
  form: TimesheetSettings;
  updateField: FieldUpdater<SystemSettings>;
};

export type SystemResourceManagementPageProps = {
  form: ResourceManagementSettings;
  updateField: FieldUpdater<SystemSettings>;
};
