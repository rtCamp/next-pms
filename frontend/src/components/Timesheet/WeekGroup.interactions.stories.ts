import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import WeekGroup from "./WeekGroup.vue";
import visual from "./WeekGroup.stories";
import { WEEK_DATES } from "./WeekGroup.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/WeekGroup/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof WeekGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABEL = "Dec 29 - Jan 4, 2026";

const toggle = (canvasElement: HTMLElement, label = LABEL) =>
  within(canvasElement).getByRole("button", { name: `Toggle ${label}` });

export const TotalsAddTimeOff: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const total = canvas
      .getByText("Projects")
      .closest("div.flex.w-full") as HTMLElement;
    const cells = within(total).getAllByRole("button");
    // Mon 2h; Tue 3h + 1h; Wed 2h + half a day off; Thu 4h + New Year's Day.
    await expect(cells[1]).toHaveTextContent("02:00");
    await expect(cells[2]).toHaveTextContent("04:00");
    await expect(cells[3]).toHaveTextContent("06:00");
    await expect(cells[4]).toHaveTextContent("12:00");
    await expect(within(total).getByText("24:00")).toBeVisible();
  },
};

export const CollapsedShowsWeekTotal: Story = {
  args: { defaultCollapsed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(canvas.getByText("24:00")).toBeVisible();
    await expect(canvas.queryByText("Projects")).toBeNull();
  },
};

const themeProbe: Story["render"] = (args) => ({
  components: { WeekGroup },
  setup: () => ({ args }),
  template: `
    <WeekGroup v-bind="args">
      <template #default="{ totalHours, totalHoursTheme, dailyHours }">
        <p>{{ totalHours }}: {{ totalHoursTheme }}, {{ dailyHours }}h a day</p>
      </template>
    </WeekGroup>
  `,
});

export const ShortOfExpectedHoursIsRed: Story = {
  render: themeProbe,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("24:00: red, 8h a day"),
    ).toBeVisible();
  },
};

export const ExpectedHoursMetIsGreen: Story = {
  args: {
    leaves: [],
    holidays: [],
    workingHour: 12,
    workingFrequency: "Per Week",
  },
  render: themeProbe,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("12:00: green, 2.4h a day"),
    ).toBeVisible();
  },
};

export const OverExpectedHoursIsAmber: Story = {
  args: { leaves: [], holidays: [], workingHour: 2 },
  render: themeProbe,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("12:00: amber, 2h a day"),
    ).toBeVisible();
  },
};

export const ToggleHidesRows: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Bug triage")).toBeVisible();
    await userEvent.click(toggle(canvasElement));
    await expect(canvas.queryByText("Bug triage")).toBeNull();
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await userEvent.click(toggle(canvasElement));
    await expect(canvas.getByText("Bug triage")).toBeVisible();
    await expect(args.onToggle).toHaveBeenLastCalledWith(false);
  },
};

export const SubmitEmits: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Submit for approval",
      }),
    );
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};

export const ApprovedWeekHasNoSubmit: Story = {
  args: { status: "Approved" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("button", {
        name: /submit for approval/i,
      }),
    ).toBeNull();
  },
};

export const BackdateLimitLocksEarlierDays: Story = {
  args: { backdateRestrictedBefore: WEEK_DATES[2] },
  play: async ({ canvasElement }) => {
    const total = within(canvasElement)
      .getByText("Projects")
      .closest("div.flex.w-full") as HTMLElement;
    const cells = within(total).getAllByRole("button");
    await expect(cells[1]).toBeDisabled();
    await expect(cells[2]).toBeDisabled();
    await expect(cells[3]).toBeEnabled();
  },
};

export const ApprovedEntriesLockProjectDay: Story = {
  play: async ({ canvasElement }) => {
    const project = within(canvasElement)
      .getByText("Blue Harbour CMS Migration")
      .closest("div.flex.w-full") as HTMLElement;
    const cells = within(project).getAllByRole("button");
    // The chevron, then Monday (approved) and Tuesday.
    await expect(cells[1]).toBeDisabled();
    await expect(cells[2]).toBeEnabled();
  },
};

export const TeamWeekShowsPendingCountWithoutTotals: Story = {
  ...visual,
  args: {
    label: "Last week",
    status: undefined,
    readOnly: true,
    tasks: undefined,
    approvalPendingCount: 2,
    defaultCollapsed: true,
  },
  render: (args) => ({
    components: { WeekGroup },
    setup: () => ({ args }),
    template: `<WeekGroup v-bind="args" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("· 2 pending approvals")).toBeVisible();
    await expect(canvas.queryByText("00:00")).toBeNull();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
  },
};
