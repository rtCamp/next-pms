import type { LookupOption } from "@/composables/useRemoteLookup";
import type { CalendarEvent, TaskLookupOption } from "./types";

export const PROJECTS: LookupOption[] = [
  { label: "Website Revamp", value: "PROJ-0001" },
  { label: "Mobile App", value: "PROJ-0002" },
];

export const TASKS: TaskLookupOption[] = [
  {
    label: "Fix login redirect",
    value: "TASK-0001",
    projectId: "PROJ-0001",
    projectName: "Website Revamp",
    status: "Working",
  },
  {
    label: "Push notifications",
    value: "TASK-0002",
    projectId: "PROJ-0002",
    projectName: "Mobile App",
    status: "Open",
  },
  {
    label: "Release checklist",
    value: "TASK-0003",
    projectId: "PROJ-0002",
    projectName: "Mobile App",
    status: "Completed",
  },
];

export const EMPLOYEES: LookupOption[] = [
  { label: "Asha Rao", value: "HR-EMP-0001" },
  { label: "Ben Ortiz", value: "HR-EMP-0002" },
];

export const EVENTS: CalendarEvent[] = [
  {
    id: "evt-standup",
    subject: "Daily standup",
    starts_on: "2026-10-16 09:30:00",
    ends_on: "2026-10-16 10:00:00",
    all_day: 0,
  },
  {
    id: "evt-review",
    subject: "Sprint review",
    starts_on: "2026-10-17 14:00:00",
    ends_on: "2026-10-17 15:00:00",
    all_day: 0,
  },
];

export const PREFILLED = {
  date: "2026-10-16",
  project: "PROJ-0001",
  projectLabel: "Website Revamp",
  task: "TASK-0001",
  taskLabel: "Fix login redirect",
};
