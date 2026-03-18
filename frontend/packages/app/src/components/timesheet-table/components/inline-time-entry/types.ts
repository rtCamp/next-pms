import type { KeyboardEvent, ReactNode } from "react";
import { EntryFormMode } from ".";
import { TimeEntryFormApi } from "./form";

export interface InlineTimeEntryProps {
  date: string;
  employee: string;
  task: string;
  dailyWorkingHours?: number;
  totalUsedHoursInDay?: number;
  onSubmitSuccess?: () => void;
  isBillable?: boolean;
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
