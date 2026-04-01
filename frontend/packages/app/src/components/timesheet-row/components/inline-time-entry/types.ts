import type { KeyboardEvent, ReactNode } from "react";
import { TaskDataItemProps } from "@/types/timesheet";
import { EntryFormMode } from ".";
import { TimeEntryFormApi } from "./form";

export interface InlineTimeEntryProps {
  date: string;
  employee: string;
  taskKey: string;
  tasks: TaskDataItemProps[];
  disabled: boolean;
  dailyWorkingHours?: number;
  totalUsedHoursInDay?: number;
  onSubmitSuccess?: () => void;
  timeEntry: {
    time: string;
    nonBillable: boolean;
    disabled: boolean;
  };
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
