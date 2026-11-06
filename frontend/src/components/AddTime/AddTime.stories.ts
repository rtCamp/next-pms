import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import AddTime from "./AddTime.vue";
import {
  EMPLOYEES,
  EVENTS,
  PREFILLED,
  PROJECTS,
  TASKS,
} from "./AddTime.fixtures";

const meta = {
  title: "Components/AddTime",
  component: AddTime,
  tags: ["autodocs"],
  args: {
    open: true,
    prefill: { date: "2026-10-16" },
    projectOptions: PROJECTS,
    taskOptions: TASKS,
    employeeOptions: EMPLOYEES,
    maxDuration: 8,
    hoursLeft: 6,
    save: fn(async () => undefined),
    "onUpdate:open": fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { AddTime },
      setup: () => ({
        args,
        update: (changed: Record<string, unknown>) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, changed);
          updateArgs(changed);
        },
      }),
      template: `
        <AddTime
          v-bind="args"
          @update:open="update({ open: $event })"
          @update:show-calendar-events="update({ showCalendarEvents: $event })"
        />
      `,
    };
  },
} satisfies Meta<typeof AddTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Prefilled: Story = {
  args: { prefill: PREFILLED },
};

export const WithEmployeePicker: Story = {
  args: {
    pickEmployee: true,
    prefill: {
      ...PREFILLED,
      employeeId: "HR-EMP-0001",
      employeeLabel: "Asha Rao",
    },
  },
};

export const HoursLoading: Story = {
  args: { hoursLoading: true },
};

export const CalendarEvents: Story = {
  args: {
    calendarSetup: true,
    showCalendarEvents: true,
    calendarEvents: EVENTS,
  },
};

export const CalendarEventsLoading: Story = {
  args: {
    calendarSetup: true,
    showCalendarEvents: true,
    calendarLoading: true,
  },
};

export const NoCalendarEvents: Story = {
  args: { calendarSetup: true, showCalendarEvents: true, calendarEvents: [] },
};

export const CalendarEventsFailed: Story = {
  args: { calendarSetup: true, showCalendarEvents: true, calendarError: true },
};
