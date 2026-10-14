import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import WeekRow from "./WeekRow.vue";
import type { ApprovalStatus } from "./types";

const DATES = [
  "Dec 29",
  "Dec 30",
  "Dec 31",
  "Jan 1",
  "Jan 2",
  "Jan 3",
  "Jan 4",
];
const PAST_DATES = [
  "Dec 22",
  "Dec 23",
  "Dec 24",
  "Dec 25",
  "Dec 26",
  "Dec 27",
  "Dec 28",
];
const TODAY = "Jan 4";
const STATUSES: ApprovalStatus[] = [
  "not-submitted",
  "approved",
  "rejected",
  "approval-pending",
  "none",
];

const meta = {
  title: "Components/Timesheet/WeekRow",
  component: WeekRow,
  tags: ["autodocs"],
  args: {
    label: "This Week",
    collapsed: false,
    totalHours: "40:00",
    dates: DATES,
    today: TODAY,
    thisWeek: true,
    status: "not-submitted",
    "onUpdate:collapsed": fn(),
    onAction: fn(),
  },
  argTypes: {
    status: { control: "select", options: STATUSES },
  },
  render: (args) => ({
    components: { WeekRow },
    setup: () => ({ args, collapsed: ref(args.collapsed ?? false) }),
    template: `
      <div class="w-[1180px]">
        <WeekRow v-bind="args" v-model:collapsed="collapsed" />
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { layout: "padded", a11y: { test: "todo" } },
} satisfies Meta<typeof WeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Renders one row per entry, each with its own collapsed state. */
const renderRows =
  (rows: Array<Record<string, unknown>>, wrapperClass = "") =>
  () => ({
    components: { WeekRow },
    setup: () => ({
      rows,
      collapsed: ref(rows.map((row) => Boolean(row.collapsed))),
    }),
    template: `
      <div class="w-[1180px] ${wrapperClass}">
        <WeekRow
          v-for="(row, i) in rows"
          :key="i"
          v-bind="row"
          v-model:collapsed="collapsed[i]"
        />
      </div>
    `,
  });

const WEEK_ENTRIES = [
  { label: "This Week", status: "not-submitted", totalHours: "40:00" },
  { label: "Last Week", status: "approval-pending", totalHours: "35:00" },
  { label: "Dec 15 - Dec 21, 2025", status: "rejected", totalHours: "35:00" },
  { label: "Dec 8 - Dec 14, 2025", status: "approved", totalHours: "35:00" },
  { label: "Dec 1 - Dec 7, 2025", status: "none", totalHours: "35:00" },
] as const;

export const Default: Story = {};

export const Variants: Story = {
  render: () => ({
    components: { WeekRow },
    setup: () => ({
      entries: WEEK_ENTRIES,
      DATES,
      PAST_DATES,
      TODAY,
      collapsed: ref<Record<string, boolean>>({}),
    }),
    template: `
      <div class="w-[1180px] text-sm">
        <h2 class="py-4">This Week = True</h2>
        <WeekRow
          v-for="entry in entries"
          :key="entry.label + '-true'"
          v-bind="entry"
          v-model:collapsed="collapsed[entry.label]"
          :dates="DATES"
          :today="TODAY"
          this-week
        />
        <h2 class="py-4">This Week = False</h2>
        <WeekRow
          v-for="entry in entries"
          :key="entry.label + '-false'"
          v-bind="entry"
          v-model:collapsed="collapsed[entry.label]"
          :dates="PAST_DATES"
          :today="TODAY"
          :this-week="false"
        />
      </div>
    `,
  }),
};

export const Toggle: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Toggle week" });

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const date of DATES) {
      await expect(canvas.getByText(date.split(" ")[1])).toBeInTheDocument();
    }
    await expect(canvas.getByText("Total")).toBeInTheDocument();
    await expect(canvas.queryByText("40:00")).toBeNull();

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenLastCalledWith(true);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "false"),
    );
    await expect(canvas.queryByText("29")).toBeNull();
    await expect(canvas.queryByText("Total")).toBeNull();
    await expect(canvas.getByText("40:00")).toBeInTheDocument();

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "true"),
    );
    await expect(canvas.getByText("29")).toBeInTheDocument();
    await expect(canvas.getByText("Total")).toBeInTheDocument();
    await expect(canvas.queryByText("40:00")).toBeNull();
  },
};

export const TodayHighlight: Story = {
  tags: ["interaction"],
  render: renderRows([
    {
      label: "This week — Jan 4 should be highlighted",
      totalHours: "40:00",
      dates: DATES,
      today: TODAY,
      thisWeek: true,
      status: "not-submitted",
    },
    {
      label: "Past week — Jan 4 should NOT be highlighted",
      totalHours: "35:00",
      dates: DATES,
      today: TODAY,
      thisWeek: false,
      status: "approved",
    },
  ]),
  play: async ({ canvasElement }) => {
    const [thisWeek, pastWeek] =
      within(canvasElement).getAllByTestId("week-row");
    const today = thisWeek.querySelector('[aria-current="date"]');
    await expect(today).toHaveTextContent("Jan 4");
    await expect(
      thisWeek.querySelectorAll('[aria-current="date"]'),
    ).toHaveLength(1);
    await expect(pastWeek.querySelector('[aria-current="date"]')).toBeNull();
  },
};

export const StatusBadge: Story = {
  tags: ["interaction"],
  render: renderRows(
    STATUSES.map((status, i) => ({
      label: `Week ${"ABCDE"[i]}`,
      totalHours: "40:00",
      dates: DATES,
      today: TODAY,
      thisWeek: status !== "none",
      status,
    })),
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Not Submitted")).toBeInTheDocument();
    await expect(canvas.getByText("Approved")).toBeInTheDocument();
    await expect(canvas.getByText("Rejected")).toBeInTheDocument();
    await expect(canvas.getByText("Approval Pending")).toBeInTheDocument();
    await expect(canvas.queryByText("None")).toBeNull();

    const rows = canvas.getAllByTestId("week-row");
    const icons = [
      ["Submit week", "lucide-send"],
      ["Approved", "lucide-circle-check"],
      ["Rejected", "lucide-circle-x"],
      ["Approval Pending", "lucide-hourglass"],
    ];
    for (const [i, [name, icon]] of icons.entries()) {
      const button = within(rows[i]).getByRole("button", { name });
      await expect(button.querySelector(`.${icon}`)).not.toBeNull();
    }
    await expect(within(rows[4]).getAllByRole("button")).toHaveLength(1);
  },
};

export const ActionButtonState: Story = {
  tags: ["interaction"],
  args: { onAction: fn() },
  render: (args) => ({
    components: { WeekRow },
    setup: () => ({ args, DATES, TODAY }),
    template: `
      <div class="w-[1180px] space-y-2">
        <WeekRow label="Not Submitted — action enabled" total-hours="40:00"
          :dates="DATES" :today="TODAY" this-week status="not-submitted"
          @action="args.onAction" />
        <WeekRow label="None — no action" total-hours="35:00"
          :dates="DATES" :today="TODAY" status="none" />
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const [submit, ...rest] = canvas.getAllByRole("button", {
      name: "Submit week",
    });
    await expect(submit).toBeEnabled();
    await expect(rest).toHaveLength(0);

    await userEvent.click(submit);
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};

export const TotalHoursVisibility: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { WeekRow },
    setup: () => ({ DATES, TODAY, collapsed: ref(false) }),
    template: `
      <div class="w-[1180px] space-y-2">
        <WeekRow label="Status: None" total-hours="35:00" :dates="DATES"
          :today="TODAY" status="none" v-model:collapsed="collapsed" />
        <WeekRow label="Status: Not Submitted" total-hours="40:00" :dates="DATES"
          :today="TODAY" status="not-submitted" v-model:collapsed="collapsed" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("Total")).toHaveLength(2);

    await userEvent.click(
      canvas.getAllByRole("button", { name: "Toggle week" })[0],
    );
    await waitFor(() => expect(canvas.queryByText("Total")).toBeNull());
    await expect(canvas.queryByText("35:00")).toBeNull();
    await expect(canvas.getByText("40:00")).toBeInTheDocument();
  },
};

export const TotalHoursColors: Story = {
  tags: ["interaction"],
  render: renderRows(
    [
      {
        label: "Not Submitted",
        status: "not-submitted",
        totalHours: "10:00",
        thisWeek: true,
      },
      {
        label: "Approved",
        status: "approved",
        totalHours: "20:00",
        thisWeek: true,
      },
      {
        label: "Rejected",
        status: "rejected",
        totalHours: "30:00",
        thisWeek: true,
      },
      {
        label: "Approval Pending (this week → amber)",
        status: "approval-pending",
        totalHours: "40:00",
        thisWeek: true,
      },
      {
        label: "Approval Pending (past week → red)",
        status: "approval-pending",
        totalHours: "50:00",
        thisWeek: false,
      },
    ].map((row) => ({ ...row, collapsed: true, dates: DATES, today: TODAY })),
  ),
  // Colour is the behaviour under test and has no ARIA equivalent.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("10:00")).toHaveClass("text-ink-green-4");
    await expect(canvas.getByText("20:00")).toHaveClass("text-ink-green-4");
    await expect(canvas.getByText("30:00")).toHaveClass("text-ink-red-4");
    await expect(canvas.getByText("40:00")).toHaveClass("text-ink-amber-4");
    await expect(canvas.getByText("50:00")).toHaveClass("text-ink-red-4");
  },
};

export const RejectedPastWeekButton: Story = {
  tags: ["interaction"],
  render: renderRows(
    [
      { label: "Rejected — this week", totalHours: "40:00", thisWeek: true },
      { label: "Rejected — past week", totalHours: "35:00", thisWeek: false },
    ].map((row) => ({
      ...row,
      status: "rejected",
      dates: DATES,
      today: TODAY,
    })),
    "space-y-2",
  ),
  // Colour is the behaviour under test and has no ARIA equivalent.
  play: async ({ canvasElement }) => {
    const [thisWeek, pastWeek] = within(canvasElement).getAllByRole("button", {
      name: "Rejected",
    });
    await expect(thisWeek).toHaveClass("!text-ink-red-4");
    await expect(thisWeek).not.toHaveClass("!text-ink-gray-5");
    await expect(pastWeek).toHaveClass("!text-ink-gray-5");
    await expect(pastWeek).not.toHaveClass("!text-ink-red-4");
  },
};
