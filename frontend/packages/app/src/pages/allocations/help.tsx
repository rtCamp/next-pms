/**
 * External dependencies.
 */
import {
  CELL_WIDTH,
  GanttBar,
  type FieldHelp,
  type HelpTip,
  type LegendItem,
} from "@next-pms/design-system/components";
import { Holiday } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROLE_ACCESS } from "@/lib/constant";

const LEAVE: LegendItem = {
  label: "On leave",
  children: (
    <GanttBar
      variant="timeoff"
      label="3 days off"
      left={0}
      width={3 * CELL_WIDTH}
      className="relative"
      style={{ top: 0 }}
    />
  ),
};

const HOLIDAY: LegendItem = {
  label: "Holiday",
  children: (
    <GanttBar
      variant="timeoff"
      label="Diwali"
      icon={Holiday}
      left={0}
      width={CELL_WIDTH}
      showInlineLabel={false}
      className="relative"
      style={{ top: 0 }}
    />
  ),
};

const SPLIT_ALLOCATION =
  "When an allocation's hours change on some days, its bar splits at each change.";

export const ALLOCATIONS_GRID_HELP = {
  team: {
    title: "Members grid",
    summary:
      "How much of each member's working day is allocated, across all their projects.",
    legend: [
      {
        label: "Nothing allocated",
        children: (
          <GanttBar
            variant="empty"
            label="8h free"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Partly allocated",
        children: (
          <GanttBar
            variant="under"
            label="4h free"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Fully allocated",
        children: (
          <GanttBar
            variant="full"
            label="Full"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Over capacity",
        children: (
          <GanttBar
            variant="over"
            label="2h over"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Tentative allocation",
        children: (
          <GanttBar
            variant="under"
            theme="crosshatch"
            label="4h free"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Non-billable allocation",
        children: (
          <GanttBar
            variant="full"
            billable={false}
            label="Full"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
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
      {
        label: "Hours allocated",
        children: (
          <GanttBar
            variant="projectSummary"
            label="40h / week"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Tentative allocation",
        children: (
          <GanttBar
            variant="projectSummary"
            theme="crosshatch"
            label="40h / week"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
      {
        label: "Non-billable allocation",
        children: (
          <GanttBar
            variant="allocation"
            billable={false}
            label="8h/day"
            left={0}
            width={3 * CELL_WIDTH}
            className="relative"
            style={{ top: 0 }}
          />
        ),
      },
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

const VARY_HOURS_TIP: HelpTip = {
  id: "vary-hours",
  title: "Vary the hours day by day",
  body: "Each save sets one hours value on the dates you select, so save once for each different value. Recurring allocations and ones with day changes can only change their hours here.",
  steps: [
    "Hover the allocation's bar and select its edit icon.",
    "Select Edit Schedule next to Start and end date.",
    "Select the day chips to change. Select a chip again to drop it.",
    "Set Edit hours / day or Edit total hours, check the Schedule summary, then select Save changes.",
  ],
  wiki: "Team-Allocations#vary-the-hours-day-by-day",
  roles: ROLE_ACCESS.manageAllocations,
};

export const TEAM_ALLOCATION_TIPS: HelpTip[] = [
  {
    id: "add-allocation",
    title: "Add an allocation",
    body: "Allocate a member to a project for a set of days, or repeat it over several weeks.",
    steps: [
      "Select Add allocation.",
      "Pick the Employee, then the Project.",
      "To repeat it every week, select Recurring.",
      "Pick the Start and end date and set Hours / day.",
      "Set Repeat for if it's recurring, then select Allocate.",
    ],
    wiki: "Team-Allocations#add-allocation",
    roles: ROLE_ACCESS.manageAllocations,
    motion: () => import("@/assets/motions/add-allocation?motion"),
  },
  {
    id: "allocate-from-grid",
    title: "Allocate straight from the grid",
    body: "Start an allocation with the member and dates filled in, and the project too on a project row.",
    steps: [
      "Hover an empty day on a member's or project row and select +. For several days, drag from + across them.",
      "Finish in Add allocation and select Allocate.",
    ],
    wiki: "Team-Allocations#inline-editing",
    roles: ROLE_ACCESS.manageAllocations,
    motion: () => import("@/assets/motions/drag-to-allocate?motion"),
  },
  {
    id: "resize-allocation",
    title: "Drag a bar's edge to change its dates",
    body: "Change an allocation's dates by dragging its bar. Recurring allocations and ones set to 0 hours can't be dragged.",
    steps: [
      "Expand a member.",
      "Drag the left or right edge of a project bar, then select Save.",
      "Check the dates in Edit allocation and select Save Changes.",
    ],
    wiki: "Team-Allocations#resize-a-booking-on-the-grid",
    roles: ROLE_ACCESS.manageAllocations,
    motion: () => import("@/assets/motions/resize-allocation?motion"),
  },
  {
    ...VARY_HOURS_TIP,
    motion: () => import("@/assets/motions/edit-schedule?motion"),
  },
  {
    id: "allocation-card",
    title: "Hover a bar to open its card",
    body: "Rest the pointer on a bar for a moment, or select it, to see every allocation behind it. If you can change allocations, edit and delete them from the icons in that card.",
    wiki: "Team-Allocations#the-allocation-summary-card",
  },
  {
    id: "add-project",
    title: "Allocate a member to another project",
    body: "Expand the member and select Add project under their project rows. Add allocation opens with the member filled in.",
    wiki: "Team-Allocations#expanding-a-member-row",
    roles: ROLE_ACCESS.manageAllocations,
  },
];

export const PROJECT_ALLOCATION_TIPS: HelpTip[] = [
  {
    id: "allocate-from-grid",
    title: "Allocate straight from the grid",
    body: "Start an allocation with the project and dates filled in, and the member too on a member's row.",
    steps: [
      "Hover an empty day on a project's row or a member's row and select +. For several days, drag from + across them.",
      "Finish in Add allocation and select Allocate.",
    ],
    wiki: "Project-Allocations#inline-editing",
    roles: ROLE_ACCESS.manageAllocations,
    motion: () => import("@/assets/motions/drag-to-allocate-project?motion"),
  },
  {
    id: "resize-allocation",
    title: "Drag a bar's edge to change its dates",
    body: "Change an allocation's dates by dragging its bar. Recurring allocations and ones set to 0 hours can't be dragged.",
    steps: [
      "Expand a project.",
      "Drag the left or right edge of a member's bar, then select Save.",
      "Check the dates in Edit allocation and select Save Changes.",
    ],
    wiki: "Project-Allocations#resize-an-allocation-on-the-grid",
    roles: ROLE_ACCESS.manageAllocations,
    motion: () => import("@/assets/motions/resize-allocation-project?motion"),
  },
  {
    ...VARY_HOURS_TIP,
    motion: () => import("@/assets/motions/edit-schedule-project?motion"),
  },
  {
    id: "allocation-card",
    title: "Hover a bar to open its card",
    body: "Rest the pointer on a bar, or select it, to see every allocation behind it, member by member on a project's row. If you can change allocations, edit and delete them from the icons in that card.",
    wiki: "Project-Allocations#the-allocation-summary-card",
  },
  {
    id: "add-member",
    title: "Allocate someone new to a project",
    body: "Expand the project and select Add member under its member rows. Add allocation opens with the project filled in.",
    wiki: "Project-Allocations#the-projects-grid",
    roles: ROLE_ACCESS.manageAllocations,
  },
];

export const ALLOCATION_DIALOG_TIPS: HelpTip[] = [
  {
    id: "employee-project-filter",
    title: "Can't find someone in Employee or Project?",
    body: "Once you pick a project, Employee only lists the people on that project's team. Once you pick an employee, Project only lists the projects they're on. To allocate someone who isn't on the team, add them to the project's team first.",
    wiki: "Team-Allocations#add-allocation",
    roles: ROLE_ACCESS.manageAllocations,
  },
];
