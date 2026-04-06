import type { KeyboardEvent, ReactNode } from "react";
import type { TaskRowTimeEntry } from "@next-pms/design-system/components";
import type { TaskDataItemProps } from "@/types/timesheet";
import type { EntryFormMode } from ".";
import type { TimeEntryFormApi } from "./form";

export interface InlineTimeEntryProps {
  date: string;
  employee: string;
  taskKey: string;
  tasks: TaskDataItemProps[];
  disabled: boolean | undefined;
  dailyWorkingHours?: number;
  totalUsedHoursInDay?: number;
  onSubmitSuccess?: () => void;
  timeEntry: TaskRowTimeEntry;
}

export type TimeEntryFormValues = {
  task: string;
  date: string;
  duration: number;
  comment: string;
};

export type TimeEntryFormProps = {
  form: TimeEntryFormApi;
  mode: EntryFormMode;
  hoursLeft: number;
  durationLabel: string;
  durationVariant: "default" | "compact";
  maxDurationInHours: number;
  submitting: boolean;
  editBaseline?: { duration: number; comment: string } | null;
  onSave: () => void;
  onCommentKeyDown: (e: KeyboardEvent<Element>) => void;
  children?: ReactNode;
};
