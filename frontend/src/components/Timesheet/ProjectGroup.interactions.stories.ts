import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import ProjectGroup from "./ProjectGroup.vue";
import visual from "./ProjectGroup.stories";
import { WEEK_DATES } from "./WeekGroup.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/ProjectGroup/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof ProjectGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const projectRow = (canvasElement: HTMLElement) =>
  within(
    within(canvasElement)
      .getByText("Blue Harbour CMS Migration")
      .closest("div.flex.w-full") as HTMLElement,
  );

export const SumsTasksPerDay: Story = {
  play: async ({ canvasElement }) => {
    const row = projectRow(canvasElement);
    await expect(row.getByRole("button", { name: "04:00" })).toBeVisible();
    await expect(row.getByText("08:00")).toBeVisible();
  },
};

// Monday's and Wednesday's both read 02:00; Monday has the approved entry.
export const ApprovedDayIsLocked: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      projectRow(canvasElement).getAllByRole("button", { name: "02:00" })[0],
    ).toBeDisabled();
  },
};

export const LockApprovedOff: Story = {
  args: { lockApproved: false },
  play: async ({ canvasElement }) => {
    await expect(
      projectRow(canvasElement).getAllByRole("button", { name: "02:00" })[0],
    ).toBeEnabled();
  },
};

export const CellClickEmitsDate: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      projectRow(canvasElement).getByRole("button", { name: "04:00" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(WEEK_DATES[1]);
  },
};

export const HideTimeShowsNoHours: Story = {
  args: { hideTime: true },
  play: async ({ canvasElement }) => {
    const row = projectRow(canvasElement);
    await expect(row.getAllByRole("button")).toHaveLength(1);
    await expect(row.queryByText("08:00")).toBeNull();
  },
};

export const ToggleHidesTasks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Toggle Blue Harbour CMS Migration",
      }),
    );
    await expect(canvas.queryByText("API Documentation")).toBeNull();
  },
};
