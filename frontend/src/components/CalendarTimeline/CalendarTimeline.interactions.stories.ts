import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button, dayjs } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { getWeekStart } from "@/utils/date";
import CalendarTimeline from "./CalendarTimeline.vue";
import { DEFAULT_VISIBLE_DAYS } from "./constants";
import { EVENTS, RANGE_START, TODAY } from "./CalendarTimeline.fixtures";

const meta = {
  title: "Components/CalendarTimeline/Interactions",
  component: CalendarTimeline,
  tags: ["interaction"],
  parameters: { layout: "padded" },
  args: {
    events: EVENTS,
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
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { CalendarTimeline },
      setup: () => {
        // The date control hands back a timestamp, not a Date.
        const today = new Date(args.today ?? TODAY);
        const setStart = (rangeStart: Date) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { rangeStart });
          updateArgs({ rangeStart });
        };
        const step = (direction: number) =>
          setStart(
            dayjs(args.rangeStart)
              .add(direction * (args.days ?? DEFAULT_VISIBLE_DAYS), "day")
              .toDate(),
          );
        const goToday = () => setStart(getWeekStart(today));
        return { args, today, step, goToday };
      },
      template: `
        <CalendarTimeline
          v-bind="args"
          :range-start="new Date(args.rangeStart)"
          :today="today"
          @prev="step(-1)"
          @next="step(1)"
          @today="goToday"
        />
      `,
    };
  },
} satisfies Meta<typeof CalendarTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const WithFilter: Story = {
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

const CustomHeader: Story = {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Milestones")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Today" })).toBeNull();
    await expect(canvas.queryByText("Oct 12 - Oct 25, 2026")).toBeNull();
  },
};

export const FilterSlotNextToNavigation: Story = {
  ...WithFilter,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "All projects" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Today" })).toBeVisible();
  },
};
