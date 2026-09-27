import type { CreateGrowthValues } from "./schema";

export const EMPTY_GROWTH_VALUES: CreateGrowthValues = {
  activity: "",
  category: null,
  description: "",
  client_priority: "",
  status: "",
  desired_outcome: "",
  ideation_date: "",
  activity_owner: "",
  ideation_owner: "",
  billable_outcome: "",
};

export const INPUT_CLASS =
  "bg-surface-white border-outline-gray-2 text-ink-gray-7";

export const EDITOR_CLASS =
  "px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-surface-white border rounded-md border-outline-gray-2 text-ink-gray-7";
