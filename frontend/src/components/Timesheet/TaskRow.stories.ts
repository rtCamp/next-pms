import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import TaskRow from "./TaskRow.vue";
import type { TaskRowProps, TaskRowStatus, TaskRowTimeEntry } from "./types";

const TIME_ENTRIES: TaskRowTimeEntry[] = [
  { time: "01:00" },
  { time: "02:00" },
  { time: "03:00" },
  { time: "" },
  { time: "04:00" },
  { time: "" },
  { time: "01:30" },
];
const FULL_WEEK: TaskRowTimeEntry[] = [
  { time: "01:15" },
  { time: "02:00" },
  { time: "02:30" },
  { time: "01:45" },
  { time: "02:15" },
  { time: "01:00" },
  { time: "00:45" },
];
const STATUSES: TaskRowStatus[] = [
  "open",
  "working",
  "pending-rev",
  "overdue",
  "completed",
  "cancelled",
];

const POPOVER = `
  <template #popover="{ taskIndex, dayIndex }">
    <p class="whitespace-nowrap p-2 text-sm text-ink-gray-8">
      Task Index: {{ taskIndex }}, Day Index: {{ dayIndex }}
    </p>
  </template>
`;

const meta = {
  title: "Components/Timesheet/TaskRow",
  component: TaskRow,
  tags: ["autodocs"],
  args: {
    taskIndex: 0,
    label: "UI Responsiveness Testing",
    totalHours: "11:30",
    starred: true,
    status: "open",
    timeEntries: FULL_WEEK.map((entry, i) =>
      i === 1 ? { ...entry, nonBillable: true } : entry,
    ),
    onCellClick: fn(),
  },
  argTypes: {
    status: { control: "select", options: STATUSES },
  },
  render: (args) => ({
    components: { TaskRow },
    setup: () => ({ args }),
    template: `
      <div class="w-[1180px]">
        <TaskRow v-bind="args">${POPOVER}</TaskRow>
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { a11y: { test: "todo" } },
} satisfies Meta<typeof TaskRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const TASKS: TaskRowProps[] = (
  [
    { status: "open", timeEntries: FULL_WEEK },
    {
      status: "working",
      starred: true,
      timeEntries: FULL_WEEK.map((e, i) =>
        i === 1 ? { ...e, nonBillable: true } : e,
      ),
    },
    {
      status: "pending-rev",
      timeEntries: FULL_WEEK.map((e, i) =>
        i === 5 ? { ...e, disabled: true } : e,
      ),
    },
    {
      status: "overdue",
      timeEntries: FULL_WEEK.map((e, i) =>
        i === 3 || i === 4 ? { time: "" } : e,
      ),
    },
    { status: "completed", timeEntries: FULL_WEEK },
    { status: "cancelled", timeEntries: FULL_WEEK },
  ] satisfies Partial<TaskRowProps>[]
).map((task) => ({
  label: "UI Responsiveness Testing",
  totalHours: "11:30",
  ...task,
}));

export const Variants: Story = {
  render: () => ({
    components: { TaskRow },
    setup: () => ({ tasks: TASKS }),
    template: `
      <div class="w-[1180px]">
        <TaskRow v-for="(task, i) in tasks" :key="i" :task-index="i" v-bind="task">
          ${POPOVER}
        </TaskRow>
      </div>
    `,
  }),
};

export const StatusVariants: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { TaskRow },
    setup: () => ({ STATUSES, TIME_ENTRIES }),
    template: `
      <div class="w-[1180px] space-y-1">
        <TaskRow
          v-for="status in STATUSES"
          :key="status"
          :label="status"
          :status="status"
          :time-entries="TIME_ENTRIES"
          total-hours="11:30"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByTestId("task-row");
    const expected = [
      ["Open", "lucide-circle", "text-ink-gray-3"],
      ["Working", "lucide-loader", "text-ink-gray-9"],
      ["Pending Review", "lucide-clipboard-clock", "text-ink-gray-9"],
      ["Overdue", "lucide-clock-12", "text-ink-red-4"],
      ["Completed", "lucide-circle-check-big", "text-ink-gray-9"],
      ["Cancelled", "lucide-circle-x", "text-ink-gray-9"],
    ];
    for (const [i, [name, icon, colour]] of expected.entries()) {
      const statusIcon = within(rows[i]).getByRole("img", { name });
      await expect(statusIcon).toHaveClass(icon);
      // Colour is part of the status and has no ARIA equivalent.
      await expect(statusIcon).toHaveClass(colour);
    }
  },
};

export const CellInteractions: Story = {
  tags: ["interaction"],
  args: {
    taskIndex: 3,
    label: "Fix Login Bug",
    totalHours: "07:30",
    status: "open",
    starred: false,
    timeEntries: [
      { time: "01:00" },
      { time: "" },
      { time: "02:00", nonBillable: true },
      { time: "", disabled: true },
      { time: "03:00" },
      { time: "" },
      { time: "01:30" },
    ],
    onCellClick: fn(),
  },
  render: (args) => ({
    components: { TaskRow },
    setup: () => ({ args }),
    template: `<div class="w-[1180px]"><TaskRow v-bind="args" /></div>`,
  }),
  play: async ({ canvasElement, args }) => {
    const cells = within(canvasElement).getAllByRole("button");
    await expect(cells).toHaveLength(7);
    await expect(cells[0]).toHaveAccessibleName("01:00");
    await expect(cells[1]).toHaveAccessibleName("Add time");
    await expect(cells[1]).toHaveTextContent("-");
    await expect(cells[2]).toHaveAccessibleName("02:00, non-billable");
    await expect(cells[3]).toBeDisabled();

    await userEvent.click(cells[0]);
    await expect(args.onCellClick).toHaveBeenCalledWith(3, 0);
    await userEvent.click(cells[4]);
    await expect(args.onCellClick).toHaveBeenCalledWith(3, 4);
    await userEvent.click(cells[3], { pointerEventsCheck: 0 });
    await expect(args.onCellClick).toHaveBeenCalledTimes(2);
  },
};

export const HoverPopover: Story = {
  tags: ["interaction"],
  args: { taskIndex: 2 },
  play: async ({ canvasElement }) => {
    const cells = within(canvasElement).getAllByRole("button");
    await userEvent.hover(cells[4]);
    await expect(
      await screen.findByText("Task Index: 2, Day Index: 4"),
    ).toBeInTheDocument();
  },
};

export const LabelAndStar: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { TaskRow },
    setup: () => ({ TIME_ENTRIES }),
    template: `
      <div class="w-[1180px] space-y-1">
        <TaskRow label="Starred Task" :time-entries="TIME_ENTRIES" total-hours="11:30" starred />
        <TaskRow label="Unstarred Task" :time-entries="TIME_ENTRIES" total-hours="11:30" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Starred Task")).toBeInTheDocument();
    await expect(canvas.getByText("Unstarred Task")).toBeInTheDocument();
    const [starred, unstarred] = canvas.getAllByTestId("task-row");
    await expect(
      within(starred).getByRole("img", { name: "Starred" }),
    ).toBeInTheDocument();
    await expect(
      within(unstarred).queryByRole("img", { name: "Starred" }),
    ).toBeNull();
  },
};
