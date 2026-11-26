import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { APPROVAL_STATUSES } from "@/components/ApprovalStatus";
import { NO_APPROVAL_STATUS } from "./constants";
import MemberRow from "./MemberRow.vue";
import { AVATAR, FULL_WEEK, PARTIAL_WEEK } from "./MemberRow.fixtures";

const meta = {
  title: "Components/Timesheet/MemberRow",
  component: MemberRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Julian Andrews",
    avatarUrl: AVATAR,
    collapsed: false,
    totalHours: "44:30",
    totalHoursTheme: "green",
    timeEntries: FULL_WEEK,
    status: "Approval Pending",
    onAction: fn(),
    onCellClick: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: [...APPROVAL_STATUSES, NO_APPROVAL_STATUS],
    },
    totalHoursTheme: {
      control: "select",
      options: ["green", "red", "amber", "gray"],
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { MemberRow },
      setup: () => ({
        args,
        update: (collapsed: boolean) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { collapsed });
          updateArgs({ collapsed });
        },
      }),
      template: `<MemberRow v-bind="args" @update:collapsed="update" />`,
    };
  },
} satisfies Meta<typeof MemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ApprovalPending: Story = {};

export const NotSubmitted: Story = {
  args: { status: "Not Submitted", timeEntries: PARTIAL_WEEK },
};

export const Approved: Story = { args: { status: "Approved" } };

export const Rejected: Story = {
  args: { status: "Rejected", totalHoursTheme: "red" },
};

export const Processing: Story = {
  args: { status: "Processing Timesheet" },
};

export const WithoutStatus: Story = {
  args: { status: undefined, totalHoursTheme: "gray" },
};

export const NoneStatus: Story = {
  args: { status: NO_APPROVAL_STATUS, totalHoursTheme: "gray" },
};

export const ActionHidden: Story = { args: { hideAction: true } };

export const Collapsed: Story = { args: { collapsed: true } };
