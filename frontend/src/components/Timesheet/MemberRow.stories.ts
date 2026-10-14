import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import MemberRow from "./MemberRow.vue";
import type { ApprovalStatus } from "./types";

const TIME_ENTRIES = ["1:00", "2:00", "3:00", "", "4:00", "5:00", ""];
const FULL_WEEK = [
  "08:30",
  "08:15",
  "08:45",
  "08:30",
  "07:45",
  "02:15",
  "00:30",
];
const AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="gray"/></svg>',
  );

const meta = {
  title: "Components/Timesheet/MemberRow",
  component: MemberRow,
  tags: ["autodocs"],
  args: {
    label: "Julian Andrews",
    avatarUrl: "https://randomuser.me/api/portraits/men/57.jpg",
    collapsed: false,
    totalHours: "44:30",
    timeEntries: FULL_WEEK,
    status: "approval-pending",
    "onUpdate:collapsed": fn(),
    onAction: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: [
        "not-submitted",
        "approved",
        "rejected",
        "approval-pending",
        "none",
      ],
    },
  },
  render: (args) => ({
    components: { MemberRow },
    setup: () => ({ args, collapsed: ref(args.collapsed ?? false) }),
    template: `
      <div class="w-[1180px]">
        <MemberRow v-bind="args" v-model:collapsed="collapsed" />
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { a11y: { test: "todo" } },
} satisfies Meta<typeof MemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderRows = (rows: Array<Record<string, unknown>>) => () => ({
  components: { MemberRow },
  setup: () => ({ rows, collapsed: ref(rows.map(() => false)) }),
  template: `
    <div class="w-[1180px] text-sm">
      <MemberRow
        v-for="(row, i) in rows"
        :key="i"
        v-bind="row"
        v-model:collapsed="collapsed[i]"
      />
    </div>
  `,
});

export const Default: Story = {};

export const Variants: Story = {
  render: renderRows([
    {
      label: "Julian Andrews",
      avatarUrl: "https://randomuser.me/api/portraits/men/57.jpg",
      status: "approval-pending",
      totalHours: "44:30",
      timeEntries: FULL_WEEK,
    },
    {
      label: "Christina Chang",
      avatarUrl: "https://randomuser.me/api/portraits/women/56.jpg",
      status: "approved",
      totalHours: "43:15",
      timeEntries: ["07:30", "08:30", "08:45", "08:00", "03:30", "", ""],
    },
    {
      label: "David Liu",
      avatarUrl: "https://randomuser.me/api/portraits/men/55.jpg",
      status: "rejected",
      totalHours: "35:00",
      timeEntries: FULL_WEEK,
    },
    {
      label: "Emily White",
      avatarUrl: "https://randomuser.me/api/portraits/women/55.jpg",
      status: "none",
      totalHours: "35:00",
      timeEntries: FULL_WEEK,
    },
  ]),
};

export const Toggle: Story = {
  tags: ["interaction"],
  args: {
    label: "John Doe",
    avatarUrl: AVATAR,
    totalHours: "15:00",
    timeEntries: TIME_ENTRIES,
    status: "not-submitted",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Toggle member" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getAllByText("-")).toHaveLength(2);

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenLastCalledWith(true);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "false"),
    );
    // The member's own cells stay visible; only its children collapse.
    await expect(canvas.getByText("5:00")).toBeInTheDocument();

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "true"),
    );
  },
};

const STATUS_ROWS: Array<[ApprovalStatus, string]> = [
  ["approved", "20:00"],
  ["rejected", "30:00"],
  ["approval-pending", "40:00"],
  ["none", "50:00"],
];

export const StatusVariants: Story = {
  tags: ["interaction"],
  args: { onAction: fn() },
  render: (args) => ({
    components: { MemberRow },
    setup: () => ({ args, rows: STATUS_ROWS, TIME_ENTRIES, AVATAR }),
    template: `
      <div class="w-[1180px] space-y-1">
        <MemberRow
          v-for="([status, total], i) in rows"
          :key="status"
          :label="'Member ' + 'ABCD'[i]"
          :avatar-url="AVATAR"
          :time-entries="TIME_ENTRIES"
          :total-hours="total"
          :status="status"
          @action="args.onAction(status)"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Approved")).toBeInTheDocument();
    await expect(canvas.getByText("Rejected")).toBeInTheDocument();
    await expect(canvas.getByText("Approval Pending")).toBeInTheDocument();
    await expect(canvas.queryByText("None")).toBeNull();

    const rows = canvas.getAllByTestId("member-row");
    const approved = within(rows[0]).getByRole("button", { name: "Approved" });
    const rejected = within(rows[1]).getByRole("button", { name: "Rejected" });
    const approve = within(rows[2]).getByRole("button", {
      name: "Approve week",
    });
    await expect(approved.querySelector(".lucide-circle-check")).not.toBeNull();
    await expect(rejected.querySelector(".lucide-circle-x")).not.toBeNull();
    await expect(approve.querySelector(".lucide-circle-check")).not.toBeNull();
    await expect(within(rows[3]).getAllByRole("button")).toHaveLength(1);

    await userEvent.click(approve);
    await expect(args.onAction).toHaveBeenCalledWith("approval-pending");

    // Colour is the behaviour under test and has no ARIA equivalent.
    await expect(canvas.getByText("20:00")).toHaveClass("text-ink-green-4");
    await expect(canvas.getByText("30:00")).toHaveClass("text-ink-red-4");
    await expect(canvas.getByText("40:00")).toHaveClass("text-ink-amber-4");
    await expect(canvas.getByText("50:00")).toHaveClass("text-ink-green-4");
  },
};

export const AvatarAndLabel: Story = {
  tags: ["interaction"],
  args: {
    label: "Jane Smith",
    avatarUrl: AVATAR,
    timeEntries: TIME_ENTRIES,
    totalHours: "15:00",
    status: "approved",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Jane Smith")).toBeInTheDocument();
    await expect(
      canvas.getByRole("img", { name: "Jane Smith" }),
    ).toHaveAttribute("src", AVATAR);
  },
};
