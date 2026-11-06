import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import MemberGroup from "./MemberGroup.vue";
import visual from "./MemberGroup.stories";
import { WEEK_DATES } from "./WeekGroup.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/MemberGroup/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof MemberGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const toggle = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: "Toggle Asha Rao" });

export const StartsCollapsedAndExpands: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(canvas.queryByText("Bug triage")).toBeNull();
    await userEvent.click(toggle(canvasElement));
    await expect(canvas.getByText("Bug triage")).toBeVisible();
    await expect(canvas.getByText("Time-off")).toBeVisible();
  },
};

export const ShowsWeekTotals: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "12:00" })).toBeVisible();
    await expect(canvas.getByText("24:00")).toBeVisible();
  },
};

export const CellClickEmitsDate: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "06:00" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(WEEK_DATES[2]);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};

export const DisabledLocksEveryDay: Story = {
  args: { status: "Approved", disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "06:00",
    });
    await expect(button).toBeDisabled();
    await expect(args.onCellClick).not.toHaveBeenCalled();
  },
};

export const BackdateLimitLocksEarlierDays: Story = {
  args: { backdateRestrictedBefore: WEEK_DATES[2] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "04:00" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "06:00" })).toBeEnabled();
  },
};

export const ActionEmits: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Approval pending" }),
    );
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};
