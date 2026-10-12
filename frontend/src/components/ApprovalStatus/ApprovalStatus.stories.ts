import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ApprovalStatus from "./ApprovalStatus.vue";
import { APPROVAL_STATUS_ICONS } from "./icons";
import { APPROVAL_STATUSES, type ApprovalStatusValue } from "./types";

const meta = {
  title: "Components/ApprovalStatus",
  component: ApprovalStatus,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
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

export const AllStatuses: Story = {
  render: () => ({
    components: { ApprovalStatus },
    setup: () => ({ statuses: APPROVAL_STATUSES }),
    template: `
      <div class="flex flex-col gap-2 text-base text-ink-gray-7">
        <div v-for="status in statuses" :key="status" class="flex items-center gap-2">
          <ApprovalStatus :status="status" />
          <span>{{ status }}</span>
        </div>
      </div>
    `,
  }),
};

export const NamesEveryStatus: Story = {
  tags: ["interaction"],
  render: AllStatuses.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const status of APPROVAL_STATUSES) {
      const img = canvas.getByRole("img", { name: status });
      await expect(img).toHaveAttribute("title", status);
      const { icon } = APPROVAL_STATUS_ICONS[status];
      if (icon) await expect(img.querySelector(`.${icon}`)).not.toBeNull();
    }
  },
};

export const ProcessingShowsSpinner: Story = {
  tags: ["interaction"],
  args: { status: "Processing Timesheet" },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", {
      name: "Processing Timesheet",
    });
    await expect(img.querySelector("svg.fui-spinner")).not.toBeNull();
    await expect(img.querySelector("[class*='lucide-']")).toBeNull();
  },
};

export const UnknownFallsBackToNotSubmitted: Story = {
  tags: ["interaction"],
  args: { status: "Draft" as ApprovalStatusValue },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: "Draft" });
    await expect(img.querySelector(".lucide-timer")).not.toBeNull();
  },
};

export const FollowsStatusChange: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { ApprovalStatus, Button },
    setup: () => ({ status: ref<ApprovalStatusValue>("Approval Pending") }),
    template: `
      <div class="flex items-center gap-4">
        <ApprovalStatus :status="status" />
        <Button label="Approve" @click="status = 'Approved'" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("img", { name: "Approval Pending" }),
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(canvas.getByRole("img", { name: "Approved" })).toBeInTheDocument(),
    );
  },
};
