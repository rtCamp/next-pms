import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import ProjectRow from "./ProjectRow.vue";
import visual from "./ProjectRow.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/ProjectRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof ProjectRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const toggle = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", {
    name: "Toggle Atlas UI Stabilization",
  });

export const RowClickToggles: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByText("Atlas UI Stabilization"),
    );
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};

export const KeyboardToggles: Story = {
  play: async ({ canvasElement }) => {
    toggle(canvasElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};

export const CellClickEmitsDay: Story = {
  play: async ({ canvasElement, args }) => {
    const empty = within(canvasElement).getAllByRole("button", {
      name: "Add time",
    });
    await userEvent.click(empty[0]);
    await expect(args.onCellClick).toHaveBeenCalledWith(2);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const DisabledCellIgnoresClick: Story = {
  play: async ({ canvasElement, args }) => {
    const empty = within(canvasElement).getAllByRole("button", {
      name: "Add time",
    });
    await expect(empty[1]).toBeDisabled();
    await userEvent.click(empty[1], { pointerEventsCheck: 0 });
    await expect(args.onCellClick).not.toHaveBeenCalled();
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const ShowsTotal: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("22:30")).toBeVisible();
  },
};
