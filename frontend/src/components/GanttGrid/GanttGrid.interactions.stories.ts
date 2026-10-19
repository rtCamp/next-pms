import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  screen,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
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

export const SummaryBarsShowCapacity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("Full").length).toBeGreaterThan(0);
    await expect(canvas.getByText("2h over")).toBeVisible();
    await expect(canvas.getByText("2 days off")).toBeVisible();
    // Chen has nothing booked: free capacity against a 6h day.
    await expect(canvas.getAllByText("6h free").length).toBeGreaterThan(0);
  },
};

export const ExpandedRowsShowAllocationBars: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(toggle(canvasElement, "Dana Ortiz"));
    await waitFor(() =>
      expect(canvas.getByText("6h/day for 5 days")).toBeVisible(),
    );
    await expect(canvas.getByText("4h/day for 3 days")).toBeVisible();
    // A zero-hour placeholder still shows where the allocation is.
    await expect(canvas.getByText("0h/day for 3 days")).toBeVisible();
  },
};

export const ProjectSummaryTotalsTheWeek: Story = {
  args: projectVariant,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("50h / week")).toHaveLength(2);
    await userEvent.click(toggle(canvasElement, "Atlas Redesign"));
    await waitFor(() =>
      expect(canvas.getByText("4h/day for 12 days")).toBeVisible(),
    );
  },
};

export const TimeOffBarNamesTheHalfDay: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByText("Second half off"));
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("Second half off"),
    );
  },
};

const bar = (canvasElement: HTMLElement, name: string) =>
  within(canvasElement).getByRole("button", { name });

async function expand(canvasElement: HTMLElement, name: string) {
  await userEvent.click(toggle(canvasElement, name));
  await waitFor(() => expect(toggle(canvasElement, name)).toBeVisible());
}

async function openCard(element: HTMLElement, text: string) {
  await userEvent.hover(element);
  await waitFor(() => expect(screen.getByText(text)).toBeVisible());
}

export const BarCardDescribesTheAllocation: Story = {
  play: async ({ canvasElement }) => {
    await expand(canvasElement, "Asha Rao");
    const allocation = await within(canvasElement).findByRole("button", {
      name: "4h/day for 12 days",
    });
    await openCard(allocation, "Oct 19, 2026 – Oct 30, 2026");
    await expect(screen.getByText("4h/day (48 hours)")).toBeVisible();
    await expect(screen.getByText("Confirmed")).toBeVisible();
    await expect(screen.getByText("Billable")).toBeVisible();
    await expect(screen.getByText("Last edited on Oct 12")).toBeVisible();
    await expect(
      screen.getByRole("link", { name: "Open project" }),
    ).toHaveAttribute("href", "/next-pms/projects/PROJ-0001");
  },
};

export const CardEditEmitsEdit: Story = {
  play: async ({ canvasElement, args }) => {
    await expand(canvasElement, "Asha Rao");
    const allocation = await within(canvasElement).findByRole("button", {
      name: "4h/day for 12 days",
    });
    await openCard(allocation, "Oct 19, 2026 – Oct 30, 2026");
    await userEvent.click(
      screen.getByRole("button", { name: "Edit allocation" }),
    );
    await expect(args.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationId: "RA-0001",
        employeeName: "Asha Rao",
        projectName: "Atlas Redesign",
        hoursPerDay: 4,
        startDate: new Date(2026, 9, 19),
        endDate: new Date(2026, 9, 30),
      }),
    );
  },
};

export const CardDeleteEmitsDeleteWithTheSeries: Story = {
  play: async ({ canvasElement, args }) => {
    await expand(canvasElement, "Dana Ortiz");
    const recurring = await within(canvasElement).findByRole("button", {
      name: "8h/day for 5 days",
    });
    await openCard(recurring, "Nov 2, 2026 – Nov 6, 2026");
    await userEvent.click(
      screen.getByRole("button", { name: "Delete allocation" }),
    );
    await expect(args.onDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationId: "RA-0007",
        recurrenceId: "REC-0001",
      }),
      {
        projectName: "Beacon API",
        dateRange: "Nov 2, 2026 – Nov 6, 2026",
        hoursPerDay: "8h/day",
        totalHours: "40 hours",
      },
    );
  },
};

export const StackedAllocationsShareACard: Story = {
  play: async ({ canvasElement }) => {
    await expand(canvasElement, "Ben Ito");
    const ai = await within(canvasElement).findByRole("button", {
      name: "6h/day for 5 days Ai",
    });
    await openCard(ai, "Oct 26, 2026 – Oct 30, 2026");
    // The non-billable allocation under it is listed too.
    await expect(screen.getByText("Oct 28, 2026 – Nov 3, 2026")).toBeVisible();
    await expect(screen.getByText("Ai created on Oct 14")).toBeVisible();
  },
};

export const SummaryCardAddsForItsDays: Story = {
  play: async ({ canvasElement, args }) => {
    await openCard(
      bar(canvasElement, "2h over"),
      "Oct 21, 2026 – Oct 23, 2026",
    );
    await expect(screen.getByText("Oct 19, 2026 – Oct 23, 2026")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await expect(args.onAdd).toHaveBeenCalledWith({
      employeeId: "HR-EMP-0004",
      employeeName: "Dana Ortiz",
      startDate: new Date(2026, 9, 21),
      endDate: new Date(2026, 9, 23),
    });
  },
};

export const TimeOffCardNamesTheLeave: Story = {
  play: async ({ canvasElement }) => {
    await openCard(
      bar(canvasElement, "2 days off"),
      "Oct 26, 2026 – Nov 6, 2026",
    );
    await expect(screen.getAllByText("2 days off")).toHaveLength(2);
  },
};

export const ProjectSummaryCardListsEmployees: Story = {
  args: projectVariant,
  play: async ({ canvasElement }) => {
    const [firstWeek] = within(canvasElement).getAllByRole("button", {
      name: "50h / week",
    });
    await openCard(firstWeek, "Asha Rao");
    await expect(screen.getByText("Dana Ortiz")).toBeVisible();
    await expect(
      screen.getAllByRole("link", { name: "Open employee" })[0],
    ).toHaveAttribute("href", "/desk/employee/HR-EMP-0001");
  },
};

export const EmployeeHeaderCardShowsDetails: Story = {
  play: async ({ canvasElement }) => {
    await openCard(toggle(canvasElement, "Asha Rao"), "Engineering");
    await expect(screen.getByText("₹1,200 / hour")).toBeVisible();
    await expect(screen.getByText("40h / week")).toBeVisible();
    await expect(screen.getByText("Ravi Kumar")).toBeVisible();
    await expect(
      screen.getByRole("link", { name: "Open employee" }),
    ).toHaveAttribute("href", "/desk/employee/HR-EMP-0001");
  },
};

export const ProjectHeaderCardShowsDetails: Story = {
  args: projectVariant,
  play: async ({ canvasElement }) => {
    await openCard(toggle(canvasElement, "Atlas Redesign"), "312.5h remaining");
    await expect(screen.getByText("Sep 1, 2026 - Dec 31, 2026")).toBeVisible();
    await expect(
      screen.getByRole("link", { name: "Open project" }),
    ).toHaveAttribute("href", "/next-pms/projects/PROJ-0001");
  },
};

export const ReadOnlyCardsHaveNoActions: Story = {
  args: { hasRoleAccess: false, canManageAiAllocations: false },
  play: async ({ canvasElement }) => {
    await openCard(
      bar(canvasElement, "2h over"),
      "Oct 21, 2026 – Oct 23, 2026",
    );
    await expect(
      screen.queryByRole("button", { name: "Edit allocation" }),
    ).not.toBeInTheDocument();
    await expect(
      screen.queryByRole("button", { name: "Add" }),
    ).not.toBeInTheDocument();
    await expect(
      screen.queryByRole("link", { name: "Open project" }),
    ).not.toBeInTheDocument();
  },
};

export const AiAllocationsNeedTheirOwnPermission: Story = {
  args: { canManageAiAllocations: false },
  play: async ({ canvasElement }) => {
    await expand(canvasElement, "Ben Ito");
    const ai = await within(canvasElement).findByRole("button", {
      name: "6h/day for 5 days Ai",
    });
    await openCard(ai, "Oct 26, 2026 – Oct 30, 2026");
    // Only the allocation the user made by hand can be changed.
    await expect(
      screen.getAllByRole("button", { name: "Edit allocation" }),
    ).toHaveLength(1);
  },
};
