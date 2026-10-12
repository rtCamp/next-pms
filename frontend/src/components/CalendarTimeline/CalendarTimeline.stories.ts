import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button, dayjs } from "frappe-ui";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { getWeekStart } from "../../utils/date";
import CalendarTimeline from "./CalendarTimeline.vue";
import { DEFAULT_VISIBLE_DAYS } from "./constants";
import type { CalendarTimelineEvent } from "./types";

const RANGE_START = new Date(2026, 9, 12);
const TODAY = new Date(2026, 9, 14);

const events: CalendarTimelineEvent[] = [
  {
    id: "1",
    title: "Kick-off call",
    subtitle: "Acme Website",
    date: "2026-10-12",
    color: "blue",
  },
  {
    id: "2",
    title: "Design sign-off",
    subtitle: "Acme Website",
    date: "2026-10-14",
    color: "violet",
  },
  {
    id: "3",
    title: "Sprint review",
    subtitle: "Globex Mobile App",
    date: "2026-10-14",
  },
  { id: "4", title: "Launch", date: "2026-10-20", color: "violet" },
  {
    id: "5",
    title: "Quarterly business review with stakeholders",
    subtitle: "Initech Data Platform Migration",
    date: "2026-10-22",
    color: "blue",
  },
];

const meta = {
  title: "Components/CalendarTimeline",
  component: CalendarTimeline,
  tags: ["autodocs"],
  args: {
    events,
    rangeStart: RANGE_START,
    today: TODAY,
    days: DEFAULT_VISIBLE_DAYS,
    onPrev: fn(),
    onNext: fn(),
    onToday: fn(),
  },
  argTypes: {
    rangeStart: { control: "date" },
    today: { control: "date" },
  },
  render: (args) => ({
    components: { CalendarTimeline },
    setup: () => {
      // The date control hands back a timestamp, not a Date.
      const today = new Date(args.today ?? Date.now());
      const start = ref(new Date(args.rangeStart));
      const step = (direction: number) => {
        start.value = dayjs(start.value)
          .add(direction * (args.days ?? DEFAULT_VISIBLE_DAYS), "day")
          .toDate();
      };
      const goToday = () => (start.value = getWeekStart(today));
      return { args, today, start, step, goToday };
    },
    template: `
      <CalendarTimeline
        v-bind="args"
        :range-start="start"
        :today="today"
        @prev="step(-1)"
        @next="step(1)"
        @today="goToday"
      />
    `,
  }),
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

export const NavigateRanges: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Oct 12 - Oct 25, 2026")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Next range" }));
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(canvas.getByText("Oct 26 - Nov 8, 2026")).toBeVisible(),
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Previous range" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Previous range" }),
    );
    await expect(args.onPrev).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(canvas.getByText("Sep 28 - Oct 11, 2026")).toBeVisible(),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Today" }));
    await expect(args.onToday).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(canvas.getByText("Oct 12 - Oct 25, 2026")).toBeVisible(),
    );
  },
};

export const EventsOnTheirDay: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("group")).toHaveLength(14);

    const wednesday = canvas.getByRole("group", {
      name: "Wednesday, October 14, 2026",
    });
    await expect(wednesday).toHaveAttribute("aria-current", "date");
    await expect(
      within(wednesday).getByText("Design sign-off"),
    ).toBeInTheDocument();
    await expect(
      within(wednesday).getByText("Sprint review"),
    ).toBeInTheDocument();

    const monday = canvas.getByRole("group", {
      name: "Monday, October 12, 2026",
    });
    await expect(monday).not.toHaveAttribute("aria-current");
    await expect(within(monday).getByText("Kick-off call")).toBeInTheDocument();
    await expect(within(monday).queryByText("Sprint review")).toBeNull();
  },
};

export const EventTooltip: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByText("Kick-off call");
    await userEvent.hover(title);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Kick-off call - Acme Website",
      ),
    );
  },
};

export const CustomHeaderReplacesNavigation: Story = {
  ...CustomHeader,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Milestones")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Today" })).toBeNull();
    await expect(canvas.queryByText("Oct 12 - Oct 25, 2026")).toBeNull();
  },
};

export const FilterSlotNextToNavigation: Story = {
  ...WithFilter,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "All projects" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Today" })).toBeVisible();
  },
};
