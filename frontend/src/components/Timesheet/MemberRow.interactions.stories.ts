import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import MemberRow from "./MemberRow.vue";
import visual from "./MemberRow.stories";
import { NO_APPROVAL_STATUS } from "./constants";
import { PARTIAL_WEEK } from "./MemberRow.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/MemberRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof MemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const toggle = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: "Toggle Julian Andrews" });

export const RowClickToggles: Story = {
  play: async ({ canvasElement }) => {
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await userEvent.click(within(canvasElement).getByText("Julian Andrews"));
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await userEvent.click(within(canvasElement).getByText("Julian Andrews"));
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
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
    await userEvent.keyboard(" ");
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const CellClickEmitsDayAndDate: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "08:15" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(1, "2025-12-30");
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const DisabledCellIgnoresClick: Story = {
  args: { timeEntries: PARTIAL_WEEK },
  play: async ({ canvasElement, args }) => {
    const cells = within(canvasElement).getAllByRole("button", {
      name: "Add time",
    });
    await expect(cells[1]).toBeDisabled();
    await userEvent.click(cells[1], { pointerEventsCheck: 0 });
    await expect(args.onCellClick).not.toHaveBeenCalled();
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const ActionEmitsWithoutToggling: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Approval pending" }),
    );
    await expect(args.onAction).toHaveBeenCalledTimes(1);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const HideActionRemovesButton: Story = {
  args: { hideAction: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("button", { name: "Approval pending" }),
    ).toBeNull();
  },
};

export const NoActionWithoutStatus: Story = {
  args: { status: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Approval pending")).toBeNull();
    await expect(canvas.getAllByRole("button")).toHaveLength(8);
  },
};

export const NoneStatusHidesBadgeAndAction: Story = {
  args: { status: NO_APPROVAL_STATUS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Approval pending")).toBeNull();
    await expect(
      canvas.queryByRole("button", { name: "Approval pending" }),
    ).toBeNull();
  },
};
