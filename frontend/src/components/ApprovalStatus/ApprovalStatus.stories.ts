import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ApprovalStatus from "./ApprovalStatus.vue";
import { APPROVAL_STATUSES } from "./types";

const meta = {
  title: "Components/ApprovalStatus",
  component: ApprovalStatus,
  tags: ["autodocs"],
  args: { status: "Approved" },
  argTypes: {
    status: { control: "select", options: [...APPROVAL_STATUSES] },
  },
  render: (args) => ({
    components: { ApprovalStatus },
    setup: () => ({ args }),
    template: `<ApprovalStatus v-bind="args" />`,
  }),
} satisfies Meta<typeof ApprovalStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotSubmitted: Story = { args: { status: "Not Submitted" } };
export const ApprovalPending: Story = { args: { status: "Approval Pending" } };
export const Approved: Story = { args: { status: "Approved" } };
export const Rejected: Story = { args: { status: "Rejected" } };
export const PartiallyApproved: Story = {
  args: { status: "Partially Approved" },
};
export const PartiallyRejected: Story = {
  args: { status: "Partially Rejected" },
};
export const ProcessingTimesheet: Story = {
  args: { status: "Processing Timesheet" },
};
