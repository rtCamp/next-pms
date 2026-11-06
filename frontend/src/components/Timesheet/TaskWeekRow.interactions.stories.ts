import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import TaskWeekRow from "./TaskWeekRow.vue";
import visual from "./TaskWeekRow.stories";
import { DOCS_TASK, WEEK_DATES } from "./WeekGroup.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/TaskWeekRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TaskWeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const withEntrySlot: Story["render"] = (args) => ({
  components: { TaskWeekRow },
  setup: () => ({ args }),
  template: `
    <TaskWeekRow v-bind="args">
      <template #entry="{ date, entries, cell }">
        <div class="w-60 p-2 text-sm">
          <p>{{ date }}: {{ entries.length }} entries, {{ cell.status ?? "no status" }}</p>
          <p v-if="cell.rejectionReason">Reason: {{ cell.rejectionReason }}</p>
        </div>
      </template>
    </TaskWeekRow>
  `,
});

export const TotalLeavesOutRejectedHours: Story = {
  play: async ({ canvasElement }) => {
    // 2 + 3 + 1.5 + 0.5; Friday's 2 rejected hours show in the cell only.
    await expect(within(canvasElement).getByText("07:00")).toBeVisible();
  },
};

export const FullyApprovedDayIsLocked: Story = {
  play: async ({ canvasElement, args }) => {
    // Monday, Wednesday and Friday (rejected) all read 02:00.
    const [monday] = within(canvasElement).getAllByRole("button", {
      name: "02:00",
    });
    await expect(monday).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(monday);
    await expect(args.onCellClick).not.toHaveBeenCalled();
  },
};

export const CellClickEmitsDate: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "03:00" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(WEEK_DATES[1]);
  },
};

export const NonBillableIsMarked: Story = {
  args: { task: DOCS_TASK },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("img", { name: "Non-billable" }),
    ).toBeInTheDocument();
  },
};

export const EntrySlotGetsDayEntries: Story = {
  render: withEntrySlot,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "03:00" }),
    );
    const text = await screen.findByText(
      `${WEEK_DATES[1]}: 1 entries, Approval Pending`,
    );
    await waitFor(() => expect(text).toBeVisible());
  },
};

export const RejectedDayShowsReason: Story = {
  render: withEntrySlot,
  play: async ({ canvasElement }) => {
    const cells = within(canvasElement).getAllByRole("button", {
      name: "02:00",
    });
    await userEvent.click(cells[2]);
    await waitFor(() =>
      expect(
        screen.getByText(`${WEEK_DATES[4]}: 1 entries, Rejected`),
      ).toBeVisible(),
    );
    await expect(
      screen.getByText("Reason: Logged on the wrong task"),
    ).toBeVisible();
  },
};

export const CardShowsTask: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(
      within(canvasElement).getByRole("button", {
        name: "UI Responsiveness Testing",
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("Blue Harbour CMS Migration")).toBeVisible(),
    );
  },
};
