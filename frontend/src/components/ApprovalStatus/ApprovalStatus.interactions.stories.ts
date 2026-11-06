import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ApprovalStatus from "./ApprovalStatus.vue";
import { APPROVAL_STATUSES, type ApprovalStatusValue } from "./types";

const meta = {
  title: "Components/ApprovalStatus/Interactions",
  component: ApprovalStatus,
  tags: ["interaction"],
  args: { status: "Approved" },
  render: (args) => ({
    components: { ApprovalStatus },
    setup: () => ({ args }),
    template: `<ApprovalStatus v-bind="args" />`,
  }),
} satisfies Meta<typeof ApprovalStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NamesEveryStatus: Story = {
  render: () => ({
    components: { ApprovalStatus },
    setup: () => ({ statuses: APPROVAL_STATUSES }),
    template: `
      <div class="flex flex-col gap-2">
        <ApprovalStatus v-for="status in statuses" :key="status" :status="status" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const status of APPROVAL_STATUSES) {
      const img = canvas.getByRole("img", { name: status });
      await expect(img).toHaveAttribute("title", status);
    }
  },
};

export const UnknownStatusKeepsItsName: Story = {
  args: { status: "Draft" as ApprovalStatusValue },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: "Draft" });
    await expect(img).toHaveAttribute("title", "Draft");
  },
};

export const FollowsStatusChange: Story = {
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
