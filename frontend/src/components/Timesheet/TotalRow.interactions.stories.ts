import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import TotalRow from "./TotalRow.vue";
import visual from "./TotalRow.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/TotalRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TotalRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StarImportsLikedTasks: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Import liked tasks to this week",
      }),
    );
    await expect(args.onStar).toHaveBeenCalledTimes(1);
  },
};

export const StarredClearsImport: Story = {
  args: { starred: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Clear imported tasks" }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Import liked tasks to this week" }),
    ).toBeNull();
  },
};

export const CellClickEmitsDayAndDate: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "08:45" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(2, "2025-12-31");
  },
};

export const DisabledRowDisablesCells: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const time of ["08:30", "08:15", "08:45", "07:45"]) {
      await expect(canvas.getByRole("button", { name: time })).toBeDisabled();
    }
    for (const cell of canvas.getAllByRole("button", { name: "Add time" })) {
      await expect(cell).toBeDisabled();
    }
    await userEvent.click(canvas.getByRole("button", { name: "08:30" }), {
      pointerEventsCheck: 0,
    });
    await expect(args.onCellClick).not.toHaveBeenCalled();
  },
};

export const ShowsLevels: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Projects")).toBeVisible();
    await expect(within(canvasElement).getByText("Tasks")).toBeVisible();
  },
};
