import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import CalendarTimeline from "./CalendarTimeline.vue";
import { DEFAULT_VISIBLE_DAYS } from "./constants";
import { EVENTS, RANGE_START, TODAY } from "./CalendarTimeline.fixtures";

const meta = {
  title: "Components/CalendarTimeline",
  component: CalendarTimeline,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    events: EVENTS,
    rangeStart: RANGE_START,
    today: TODAY,
    days: DEFAULT_VISIBLE_DAYS,
    "onUpdate:rangeStart": fn(),
  },
  argTypes: {
    rangeStart: { control: "date" },
    today: { control: "date" },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { CalendarTimeline },
      setup: () => ({
        args,
        update: (rangeStart: Date) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { rangeStart });
          updateArgs({ rangeStart });
        },
      }),
      // The date controls hand back timestamps, not Dates.
      template: `
        <CalendarTimeline
          v-bind="args"
          :range-start="new Date(args.rangeStart)"
          :today="args.today && new Date(args.today)"
          @update:range-start="update"
        />
      `,
    };
  },
} satisfies Meta<typeof CalendarTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { events: [] } };

export const OneWeek: Story = { args: { days: 7 } };

export const AcrossYears: Story = {
  args: {
    rangeStart: new Date(2026, 11, 21),
    today: new Date(2026, 11, 25),
    events: [
      { id: "ny", title: "Year-end freeze", date: "2026-12-28" },
      { id: "q1", title: "Q1 planning", date: "2027-01-04", color: "violet" },
    ],
  },
};

export const CustomRangeLabel: Story = {
  args: { rangeLabel: "Sprint 42 and 43" },
};

export const WithFilter: Story = {
  render: (args) => ({
    components: { CalendarTimeline, Button },
    setup: () => ({ args }),
    template: `
      <CalendarTimeline v-bind="args">
        <template #filter>
          <Button label="All projects" icon-right="lucide-chevron-down" />
        </template>
      </CalendarTimeline>
    `,
  }),
};

export const CustomHeader: Story = {
  render: (args) => ({
    components: { CalendarTimeline, Button },
    setup: () => ({ args }),
    template: `
      <CalendarTimeline v-bind="args">
        <template #header>
          <span class="text-lg font-semibold text-ink-gray-8">Milestones</span>
          <Button variant="ghost" label="Export" icon-left="lucide-download" />
        </template>
      </CalendarTimeline>
    `,
  }),
};
