import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import WeekRow from "./WeekRow.vue";
import visual from "./WeekRow.stories";
import { NO_APPROVAL_STATUS } from "./constants";
import { PAST_DATES } from "./WeekRow.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/WeekRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof WeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const toggle = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: "Toggle This Week" });

export const RowClickToggles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await userEvent.click(canvas.getByText("This Week"));
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(args["onUpdate:collapsed"]).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByText("This Week"));
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const ChevronTogglesFromKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const button = toggle(canvasElement);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-expanded", "true");
  },
};

export const CollapsedShowsTotal: Story = {
  args: { collapsed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("40:00")).toBeVisible();
    await expect(canvas.queryByText("Total")).toBeNull();
  },
};

export const ExpandedShowsDates: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Total")).toBeVisible();
    await expect(canvas.queryByText("40:00")).toBeNull();
  },
};

export const SubmitDoesNotToggle: Story = {
  play: async ({ canvasElement, args }) => {
    const submit = within(canvasElement).getByRole("button", {
      name: "Submit for approval",
    });
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(toggle(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const RejectedOffersResubmit: Story = {
  args: { status: "Rejected" },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Resubmit for approval",
      }),
    );
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};

export const PartiallyRejectedOffersResubmit: Story = {
  args: { status: "Partially Rejected" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", {
        name: "Resubmit for approval",
      }),
    ).toBeInTheDocument();
  },
};

export const ApprovedShowsStatusOnly: Story = {
  args: { status: "Approved" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Approved" })).toBeVisible();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
  },
};

export const PendingShowsStatusOnly: Story = {
  args: { status: "Approval Pending" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("img", { name: "Approval Pending" }),
    ).toBeVisible();
    await expect(canvas.getByText("Approval pending")).toBeVisible();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
  },
};

export const ProcessingShowsStatusOnly: Story = {
  args: { status: "Processing Timesheet" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("img", { name: "Processing Timesheet" }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
  },
};

export const NoStatusHidesBadgeAndAction: Story = {
  args: { status: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Not submitted")).toBeNull();
    await expect(canvas.queryByRole("img")).toBeNull();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
  },
};

export const MarksTodayInThisWeek: Story = {
  play: async ({ canvasElement }) => {
    const today = within(canvasElement)
      .getByText("4")
      .closest("[aria-current]");
    await expect(today).toHaveAttribute("aria-current", "date");
  },
};

export const NoTodayInOtherWeeks: Story = {
  args: { thisWeek: false, dates: PAST_DATES },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[aria-current]")).toBeNull();
  },
};

export const ShowsBadgeLabel: Story = {
  args: { badgeLabel: "· 2 pending approvals" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("· 2 pending approvals"),
    ).toBeVisible();
  },
};

export const NoneStatusHidesBadgeAndAction: Story = {
  args: { status: NO_APPROVAL_STATUS, collapsed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Not submitted")).toBeNull();
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
    await expect(canvas.queryByText("40:00")).toBeNull();
  },
};
