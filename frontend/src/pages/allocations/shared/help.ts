import {
  CELL_WIDTH,
  GanttBar,
  GanttTimeoffBar,
  type BarVariant,
} from "@/components/GanttGrid";
import type { FieldHelp, LegendItem } from "@/components/InfoHoverCard";

const SAMPLE_DAY = new Date(2026, 0, 5);

/** A grid bar drawn in place in a legend instead of at its column. */
const SAMPLE_PLACEMENT = {
  left: 0,
  class: "relative",
  style: { top: 0 },
};

function barSample(
  label: string,
  variant: BarVariant,
  barLabel: string,
  options: { crosshatch?: boolean; billable?: boolean } = {},
): LegendItem {
  return {
    label,
    component: GanttBar,
    props: {
      ...SAMPLE_PLACEMENT,
      variant,
      label: barLabel,
      width: 3 * CELL_WIDTH,
      ...options,
    },
  };
}

const LEAVE: LegendItem = {
  label: "On leave",
  component: GanttTimeoffBar,
  props: {
    ...SAMPLE_PLACEMENT,
    startDate: SAMPLE_DAY,
    endDate: new Date(2026, 0, 7),
    width: 3 * CELL_WIDTH,
  },
};

const HOLIDAY: LegendItem = {
  label: "Holiday",
  component: GanttTimeoffBar,
  props: {
    ...SAMPLE_PLACEMENT,
    startDate: SAMPLE_DAY,
    endDate: SAMPLE_DAY,
    holiday: "Diwali",
    width: CELL_WIDTH,
  },
};

const SPLIT_ALLOCATION =
  "When an allocation's hours change on some days, its bar splits at each change.";

export const ALLOCATIONS_GRID_HELP = {
  team: {
    title: "Members grid",
    summary:
      "How much of each member's working day is allocated, across all their projects.",
    legend: [
      barSample("Nothing allocated", "empty", "8h free"),
      barSample("Partly allocated", "under", "4h free"),
      barSample("Fully allocated", "full", "Full"),
      barSample("Over capacity", "over", "2h over"),
      barSample("Tentative allocation", "under", "4h free", {
        crosshatch: true,
      }),
      barSample("Non-billable allocation", "full", "Full", {
        billable: false,
      }),
      LEAVE,
      HOLIDAY,
    ],
    details: [
      "Each column is one day in every view. A pill covers the days in a row with the same hours allocated.",
      "Free and over compare each day's allocations with the member's daily working hours. Weekends get no free pill.",
      `Expand a member for one row per project. ${SPLIT_ALLOCATION}`,
    ],
    wiki: "Team-Allocations#the-members-grid",
  },
  project: {
    title: "Projects grid",
    summary: "Hours allocated on each project, added up across its members.",
    legend: [
      barSample("Hours allocated", "projectSummary", "40h / week"),
      barSample("Tentative allocation", "projectSummary", "40h / week", {
        crosshatch: true,
      }),
      barSample("Non-billable allocation", "allocation", "8h/day", {
        billable: false,
      }),
      LEAVE,
      HOLIDAY,
    ],
    details: [
      "A bar covers days with the same hours allocated, within one Monday to Friday week. Its hours are the total for those days.",
      "Under each name are the dates its allocations in view start and end, then the customer. The project's own dates are in its card.",
      `Expand a project for one row per member. ${SPLIT_ALLOCATION}`,
    ],
    wiki: "Project-Allocations#the-projects-grid",
  },
} satisfies Record<string, FieldHelp>;

const COMBINE_TYPES =
  "Options of the same kind add up, such as Billable and Non-billable. Different kinds narrow each other, such as Confirmed with Billable.";

export const ALLOCATION_TYPE_HELP = {
  team: {
    title: "Allocation type",
    summary:
      "Shows only members with a matching allocation in view, and draws only the matching allocations.",
    details: [
      COMBINE_TYPES,
      "No allocation only adds members with nothing allocated in view.",
      "Free and over hours then count only the allocations shown.",
    ],
    wiki: "Team-Allocations#toolbar",
  },
  project: {
    title: "Allocation type",
    summary:
      "Shows only projects with a matching allocation in view, and draws only the matching allocations.",
    details: [
      COMBINE_TYPES,
      "Bar hours and each project's remaining hours then count only the allocations shown.",
    ],
    wiki: "Project-Allocations#toolbar",
  },
} satisfies Record<string, FieldHelp>;

export const RATE_TOOLTIP =
  "Hourly cost = CTC ÷ 12 ÷ (weekly hours × 4), converted to the Default Currency at today's rate.";

export const CAPACITY_TOOLTIP =
  "Working hours per week. A day's capacity is a fifth of this.";

export const BOOKING_HOURS_TOOLTIP =
  "Hours per day × days in this stretch of the allocation. When its hours change on some days, each change starts a new stretch.";

export const REMAINING_HOURS_TOOLTIP =
  "Hours still allocated on this project from today to the end of each allocation, for all members.";

export const ALLOCATION_DIALOG_HELP = {
  repeatFor: {
    title: "Repeat for",
    summary:
      "How many more weeks to allocate the same days after the dates you picked.",
    details: [
      "1 week allocates the picked dates plus the same days one week later.",
      "The picked dates must fit in one week. Without weekends, that means one Monday to Friday.",
      "Each week is saved as its own allocation. Change them later through Edit Schedule.",
    ],
    wiki: "Team-Allocations#add-allocation",
  },
  totalHours: {
    title: "Total hours",
    summary: "All the hours this allocation adds, including every repeat week.",
    formula: "Hours / day × days allocated",
    details: [
      "Weekends count only when Include weekends is ticked.",
      "Holidays and full days of leave count 0, and a half day of leave counts half, unless Include holidays is ticked.",
    ],
    wiki: "Team-Allocations#add-allocation",
  },
  includeHolidays: {
    title: "Include holidays",
    summary:
      "Allocates the full Hours / day on holidays and on the member's leave days too.",
    details: [
      "Unticked, holidays and full days of leave get 0 hours, and a half day of leave gets half.",
      "Leave counts once it's applied for, even before it's approved.",
      "The member has no working hours on those days, so they show as over-allocated.",
    ],
    wiki: "Team-Allocations#holidays-and-leave",
  },
  overAllocation: {
    title: "Over-allocation",
    summary:
      "Days where the member's allocations, with this one added, go over their working hours for that day.",
    details: [
      "Counts all their allocations on every project, tentative ones too.",
      "Holidays, leave and weekly offs give 0 working hours, and a half day of leave gives half.",
      "It's a warning only. You can still save.",
    ],
    wiki: "Team-Allocations#behaviour--states",
  },
  scheduleTotalHours: {
    title: "Edit total hours",
    summary:
      "The hours / day you set, added up over the dates you picked. Change either field and the other follows.",
    formula: "Edit hours / day × dates picked",
    details: [
      "Pick every date to set new hours for the whole allocation. A half day of leave then counts half.",
      "Pick only some dates and each gets the full hours, even a half day of leave.",
      "Days the allocation skips, such as holidays, full days of leave and weekends, can't be picked.",
    ],
    wiki: "Team-Allocations#edit-schedule",
  },
  applyEditsTo: {
    title: "Apply edits to",
    summary: "Which weeks of this recurring allocation get your changes.",
    details: [
      "This allocation changes only this week. This and future also changes every later week, on the same weekdays.",
      "The Repeats for line counts this week and every later week.",
      "Setting new hours on every date clears earlier day changes in each week it applies to.",
    ],
    wiki: "Team-Allocations#recurring-allocations-and-schedules",
  },
} satisfies Record<string, FieldHelp>;
