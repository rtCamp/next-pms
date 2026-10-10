import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import ProjectRow from "./ProjectRow.vue";

const ENTRIES = ["05:30", "06:45", "07:15", "06:00", "04:15", "04:15", "03:45"];

const meta = {
  title: "Components/Timesheet/ProjectRow",
  component: ProjectRow,
  tags: ["autodocs"],
  args: {
    label: "Atlas UI Stabilization",
    collapsed: false,
    totalHours: "42:00",
    status: "approved",
    timeEntries: ENTRIES,
    "onUpdate:collapsed": fn(),
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
    components: { ProjectRow },
    setup: () => ({ args, collapsed: ref(args.collapsed ?? false) }),
    template: `
      <div class="w-[1180px]">
        <ProjectRow v-bind="args" v-model:collapsed="collapsed" />
      </div>
    `,
  }),
} satisfies Meta<typeof ProjectRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => ({
    components: { ProjectRow },
    setup: () => ({
      args,
      first: ref(false),
      second: ref(false),
      secondEntries: ["07:15", "07:15", "07:15", "06:45", "07:00", "01:30", ""],
    }),
    template: `
      <div class="w-[1180px] text-sm">
        <ProjectRow v-bind="args" v-model:collapsed="first" />
        <ProjectRow
          v-bind="args"
          total-hours="37:00"
          status="rejected"
          :time-entries="secondEntries"
          highlight-time-entries
          v-model:collapsed="second"
        />
      </div>
    `,
  }),
};

export const Toggle: Story = {
  tags: ["interaction"],
  args: { timeEntries: ["05:30", "06:45", "", "06:00", "04:15", "", "03:45"] },
  play: async ({ canvasElement, args }) => {
    const toggle = within(canvasElement).getByRole("button", {
      name: "Toggle project",
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenLastCalledWith(true);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "false"),
    );

    await userEvent.click(toggle);
    await expect(args["onUpdate:collapsed"]).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "true"),
    );
  },
};

export const TimeEntryDisplay: Story = {
  tags: ["interaction"],
  args: {
    timeEntries: ["05:30", "06:45", "", "06:00", "04:15", "07:15", "03:45"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("05:30")).toBeInTheDocument();
    await expect(canvas.getByText("06:00")).toBeInTheDocument();
    await expect(canvas.getAllByText("-")).toHaveLength(1);
  },
};

export const TotalHoursColors: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { ProjectRow },
    setup: () => ({
      rows: [
        ["Not Submitted", "not-submitted", "10:00"],
        ["Approved", "approved", "20:00"],
        ["Rejected", "rejected", "30:00"],
        ["Approval Pending", "approval-pending", "40:00"],
        ["None", "none", "50:00"],
      ],
    }),
    template: `
      <div class="w-[1180px] space-y-1">
        <ProjectRow
          v-for="[label, status, total] in rows"
          :key="status"
          :label="label"
          :status="status"
          :total-hours="total"
          :time-entries="[]"
        />
      </div>
    `,
  }),
  // Colour is the behaviour under test and has no ARIA equivalent.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("10:00")).toHaveClass("text-ink-gray-6");
    await expect(canvas.getByText("20:00")).toHaveClass("text-ink-green-4");
    await expect(canvas.getByText("30:00")).toHaveClass("text-ink-red-4");
    await expect(canvas.getByText("40:00")).toHaveClass("text-ink-amber-4");
    const none = canvas.getByText("50:00");
    for (const colour of ["gray-6", "green-4", "red-4", "amber-4"]) {
      await expect(none).not.toHaveClass(`text-ink-${colour}`);
    }
  },
};

export const Icons: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { ProjectRow },
    template: `
      <div class="w-[1180px] space-y-1">
        <ProjectRow label="Default icon" total-hours="40:00" status="approved" :time-entries="[]" />
        <ProjectRow label="Custom prefix" total-hours="40:00" status="approved" :time-entries="[]">
          <template #prefix>
            <span class="lucide-star size-4" role="img" aria-label="Custom prefix icon" />
          </template>
        </ProjectRow>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = canvas.getAllByTestId("project-row");
    await expect(first.querySelector(".lucide-folder")).not.toBeNull();
    await expect(
      within(second).getByRole("img", { name: "Custom prefix icon" }),
    ).toBeInTheDocument();
    await expect(second.querySelector(".lucide-folder")).toBeNull();
  },
};
