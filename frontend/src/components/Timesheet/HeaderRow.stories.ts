import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import HeaderRow from "./HeaderRow.vue";
import type { TimesheetBreadcrumb } from "./types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BREADCRUMBS: TimesheetBreadcrumb[] = [
  { label: "Week" },
  { label: "Project" },
  { label: "Task" },
];

const meta = {
  title: "Components/Timesheet/HeaderRow",
  component: HeaderRow,
  tags: ["autodocs"],
  args: {
    breadcrumbs: [
      { label: "Week" },
      { label: "Project" },
      { label: "Member" },
      { label: "Task" },
    ],
    days: DAYS,
  },
  render: (args) => ({
    components: { HeaderRow },
    setup: () => ({ args }),
    template: `
      <div class="w-[1180px]">
        <HeaderRow v-bind="args" />
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { a11y: { test: "todo" } },
} satisfies Meta<typeof HeaderRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DaysAndTotal: Story = {
  tags: ["interaction"],
  args: { breadcrumbs: BREADCRUMBS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const day of DAYS) {
      await expect(canvas.getByText(day)).toBeInTheDocument();
    }
    await expect(canvas.getByText("Total")).toBeInTheDocument();
  },
};

export const BreadcrumbsRender: Story = {
  tags: ["interaction"],
  args: { breadcrumbs: BREADCRUMBS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const item of BREADCRUMBS) {
      await expect(
        canvas.getByRole("button", { name: item.label }),
      ).toBeInTheDocument();
    }
  },
};
