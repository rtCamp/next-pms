import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TotalRow from "./TotalRow.vue";
import type { TimesheetBreadcrumb } from "./types";

const BREADCRUMBS: TimesheetBreadcrumb[] = [
  { label: "Projects" },
  { label: "Tasks" },
];
const TOTAL_TIME_ENTRIES = [
  "08:30",
  "08:15",
  "08:45",
  "08:30",
  "07:45",
  "02:15",
  "00:45",
];

const meta = {
  title: "Components/Timesheet/TotalRow",
  component: TotalRow,
  tags: ["autodocs"],
  args: {
    breadcrumbs: BREADCRUMBS,
    totalHours: "44:30",
    status: "approved",
    totalTimeEntries: TOTAL_TIME_ENTRIES,
    starred: true,
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
    components: { TotalRow },
    setup: () => ({ args }),
    template: `
      <div class="w-[1180px]">
        <TotalRow v-bind="args" />
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { layout: "padded", a11y: { test: "todo" } },
} satisfies Meta<typeof TotalRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TotalHoursColors: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { TotalRow },
    setup: () => ({
      BREADCRUMBS,
      TOTAL_TIME_ENTRIES,
      rows: [
        ["not-submitted", "10:00"],
        ["approved", "20:00"],
        ["rejected", "30:00"],
        ["approval-pending", "40:00"],
        ["none", "50:00"],
      ],
    }),
    template: `
      <div class="w-[1180px] space-y-2">
        <TotalRow
          v-for="[status, total] in rows"
          :key="status"
          :breadcrumbs="BREADCRUMBS"
          :status="status"
          :total-hours="total"
          :total-time-entries="TOTAL_TIME_ENTRIES"
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

export const StarAndPrefix: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { TotalRow },
    setup: () => ({ BREADCRUMBS, TOTAL_TIME_ENTRIES }),
    template: `
      <div class="w-[1180px] space-y-2">
        <TotalRow :breadcrumbs="BREADCRUMBS" total-hours="40:00" status="approved"
          :total-time-entries="TOTAL_TIME_ENTRIES" starred />
        <TotalRow :breadcrumbs="BREADCRUMBS" total-hours="40:00" status="approved"
          :total-time-entries="TOTAL_TIME_ENTRIES" />
        <TotalRow :breadcrumbs="BREADCRUMBS" total-hours="40:00" status="approved"
          :total-time-entries="TOTAL_TIME_ENTRIES" starred>
          <template #prefix>
            <span class="lucide-star size-4" role="img" aria-label="Custom prefix icon" />
          </template>
        </TotalRow>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const [starred, unstarred, custom] =
      within(canvasElement).getAllByTestId("total-row");
    await expect(
      within(starred).getByRole("img", { name: "Starred" }),
    ).toBeInTheDocument();
    await expect(
      within(unstarred).getByRole("img", { name: "Not starred" }),
    ).toHaveClass("lucide-star-off");
    await expect(
      within(custom).getByRole("img", { name: "Custom prefix icon" }),
    ).toBeInTheDocument();
    await expect(
      within(custom).queryByRole("img", { name: "Starred" }),
    ).toBeNull();
  },
};

export const BreadcrumbsRender: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const item of BREADCRUMBS) {
      await expect(
        canvas.getByRole("button", { name: item.label }),
      ).toBeInTheDocument();
    }
  },
};
