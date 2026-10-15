import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { APPROVAL_STATUSES } from "@/components/ApprovalStatus";
import WeekRow from "./WeekRow.vue";
import { DATES, PAST_DATES, TODAY } from "./WeekRow.fixtures";

const meta = {
  title: "Components/Timesheet/WeekRow",
  component: WeekRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "This Week",
    collapsed: false,
    totalHours: "40:00",
    dates: DATES,
    today: TODAY,
    thisWeek: true,
    status: "Not Submitted",
    "onUpdate:collapsed": fn(),
    onSubmit: fn(),
  },
  argTypes: {
    status: { control: "select", options: [...APPROVAL_STATUSES] },
    totalHoursTheme: {
      control: "select",
      options: ["green", "red", "amber", "gray"],
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { WeekRow },
      setup: () => ({
        args,
        update: (collapsed: boolean) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { collapsed });
          updateArgs({ collapsed });
        },
      }),
      template: `<WeekRow v-bind="args" @update:collapsed="update" />`,
    };
  },
} satisfies Meta<typeof WeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotSubmitted: Story = {};

export const Collapsed: Story = {
  args: { collapsed: true, totalHoursTheme: "green" },
};

export const ApprovalPending: Story = {
  args: { status: "Approval Pending" },
};

export const Approved: Story = {
  args: {
    label: "Dec 22 - Dec 28",
    status: "Approved",
    thisWeek: false,
    dates: PAST_DATES,
  },
};

export const Rejected: Story = {
  args: {
    label: "Dec 22 - Dec 28",
    status: "Rejected",
    thisWeek: false,
    dates: PAST_DATES,
  },
};

export const PartiallyApproved: Story = {
  args: { status: "Partially Approved" },
};

export const Processing: Story = {
  args: { status: "Processing Timesheet" },
};

export const WithoutStatus: Story = {
  args: { status: undefined },
};

export const ShortOnHours: Story = {
  args: { collapsed: true, totalHours: "32:00", totalHoursTheme: "red" },
};

export const WithPendingApprovals: Story = {
  args: {
    status: undefined,
    badgeLabel: "· 2 pending approvals",
  },
};
