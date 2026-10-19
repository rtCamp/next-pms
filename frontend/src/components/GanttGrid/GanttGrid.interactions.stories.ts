import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import GanttGrid from "./GanttGrid.vue";
import visual from "./GanttGrid.stories";
import { EMPLOYEES, PROJECTS } from "./GanttGrid.fixtures";

const meta = {
  ...visual,
  title: "Components/GanttGrid/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof GanttGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const projectVariant = {
  variant: "project" as const,
  employees: undefined,
  projects: PROJECTS,
  rowHeaderLabel: "Projects",
};

const toggle = (canvasElement: HTMLElement, name: string) =>
  within(canvasElement).getByRole("button", { name: `Toggle ${name}` });

export const ExpandsAndCollapsesARow: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const asha = toggle(canvasElement, "Asha Rao");
    await expect(asha).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Beacon API")).not.toBeInTheDocument();

    await userEvent.click(asha);
    await expect(asha).toHaveAttribute("aria-expanded", "true");
    await expect(args.onToggle).toHaveBeenCalledWith("HR-EMP-0001", true);
    await waitFor(() => expect(canvas.getByText("Beacon API")).toBeVisible());

    await userEvent.click(asha);
    await expect(asha).toHaveAttribute("aria-expanded", "false");
    await expect(args.onToggle).toHaveBeenLastCalledWith("HR-EMP-0001", false);
    await waitFor(() =>
      expect(canvas.queryByText("Beacon API")).not.toBeInTheDocument(),
    );
  },
};

export const KeyboardToggles: Story = {
  play: async ({ canvasElement }) => {
    const ben = toggle(canvasElement, "Ben Ito");
    ben.focus();
    await userEvent.keyboard("{Enter}");
    await expect(ben).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    await expect(ben).toHaveAttribute("aria-expanded", "false");
  },
};

export const AddProjectRowEmitsAdd: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(toggle(canvasElement, "Chen Wei"));
    const add = await within(canvasElement).findByRole("button", {
      name: "Add project",
    });
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledWith({
      employeeId: "HR-EMP-0003",
      employeeName: "Chen Wei",
    });
  },
};

export const AddMemberRowEmitsAdd: Story = {
  args: projectVariant,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(toggle(canvasElement, "Cosmos Support"));
    const add = await within(canvasElement).findByRole("button", {
      name: "Add member",
    });
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledWith({
      projectId: "PROJ-0003",
      projectName: "Cosmos Support",
      customerName: "Initech",
    });
  },
};

export const ReadOnlyHidesAddRows: Story = {
  args: { hasRoleAccess: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Nothing to show under an employee without projects.
    await expect(
      canvas.queryByRole("button", { name: "Toggle Chen Wei" }),
    ).not.toBeInTheDocument();
    await userEvent.click(toggle(canvasElement, "Asha Rao"));
    await waitFor(() => expect(canvas.getByText("Beacon API")).toBeVisible());
    await expect(
      canvas.queryByRole("button", { name: "Add project" }),
    ).not.toBeInTheDocument();
  },
};

export const ProjectRowsListEmployees: Story = {
  args: projectVariant,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(toggle(canvasElement, "Atlas Redesign"));
    await waitFor(() => expect(canvas.getByText("Dana Ortiz")).toBeVisible());
    await expect(canvas.getByText("Senior Developer")).toBeVisible();
  },
};

export const LeavesOutWeekends: Story = {
  args: { showWeekend: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Oct 19 - 23")).toBeVisible();
    await expect(canvas.getByText("Nov 2 - 6")).toBeVisible();
  },
};

export const LoadsMoreAtTheEnd: Story = {
  args: { employees: EMPLOYEES, hasMore: true },
  play: async ({ canvasElement, args }) => {
    await expect(
      within(canvasElement).getByRole("status", { name: "Loading more" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(args.onLoadMore).toHaveBeenCalled());
  },
};

const headerWidth = (canvasElement: HTMLElement) =>
  within(canvasElement)
    .getByRole("columnheader", { name: "Members" })
    .getBoundingClientRect().width;

export const DragResizesTheHeaderColumn: Story = {
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", {
      name: "Resize column",
    });
    await expect(headerWidth(canvasElement)).toBe(240);
    await fireEvent.pointerDown(handle, { clientX: 240, pointerId: 1 });
    await fireEvent.pointerMove(window, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerUp(window, { clientX: 300, pointerId: 1 });
    await waitFor(() => expect(headerWidth(canvasElement)).toBe(300));
    // Never narrower than 120px.
    await fireEvent.pointerDown(handle, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerMove(window, { clientX: 0, pointerId: 1 });
    await fireEvent.pointerUp(window, { clientX: 0, pointerId: 1 });
    await waitFor(() => expect(headerWidth(canvasElement)).toBe(120));
  },
};

export const EscapeCancelsAHeaderResize: Story = {
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", {
      name: "Resize column",
    });
    await fireEvent.pointerDown(handle, { clientX: 240, pointerId: 1 });
    await fireEvent.pointerMove(window, { clientX: 340, pointerId: 1 });
    await waitFor(() => expect(headerWidth(canvasElement)).toBe(340));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(headerWidth(canvasElement)).toBe(240));
  },
};
