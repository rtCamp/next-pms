import type { KeyboardEvent } from "react";
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
  hoursLeft: number;
  durationLabel: string;
  durationVariant: "default" | "compact";
  maxDurationInHours: number;
  submitting: boolean;
  onCommentKeyDown: (e: KeyboardEvent<Element>) => void;
};