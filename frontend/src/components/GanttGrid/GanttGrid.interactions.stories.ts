import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { nextTick, shallowRef } from "vue";
import {
  expect,
  fireEvent,
  screen,
  mocked,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import { CELL_HEIGHT } from "./constants";
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

/** Expands a row and waits for its rows to finish growing, so bars stay put. */
async function expand(canvasElement: HTMLElement, name: string) {
  const button = toggle(canvasElement, name);
  await userEvent.click(button);
  const firstChild = button.closest("tr")!.nextElementSibling!;
  await waitFor(() =>
    expect(firstChild.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      CELL_HEIGHT,
    ),
  );
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
    // The card closes as the Edit dialog opens.
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Edit allocation" }),
      ).toBeNull(),
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
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Delete allocation" }),
      ).toBeNull(),
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
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Add" })).toBeNull(),
    );
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

/** Width of one day column, read from the first week's header. */
function columnWidth(canvasElement: HTMLElement) {
  const [, firstWeek] = within(canvasElement).getAllByRole("columnheader");
  return firstWeek.getBoundingClientRect().width / 7;
}

/** Presses at a point the way a pointer would: on whatever is drawn there. */
async function pressAt(
  x: number,
  y: number,
  init: Partial<PointerEventInit> = {},
) {
  const target = document.elementFromPoint(x, y)!;
  await fireEvent.pointerDown(target, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: "mouse",
    ...init,
  });
}

async function moveTo(x: number, y: number) {
  await fireEvent.pointerMove(window, { clientX: x, clientY: y, pointerId: 1 });
}

async function releaseAt(x: number, y: number) {
  await fireEvent.pointerUp(window, { clientX: x, clientY: y, pointerId: 1 });
}

/** Drags a bar's end (or start) grip by `days` columns and lets go. */
async function dragEdge(
  canvasElement: HTMLElement,
  bar: HTMLElement,
  edge: "start" | "end",
  days: number,
  release = true,
) {
  const rect = bar.getBoundingClientRect();
  const x = edge === "end" ? rect.right - 3 : rect.left + 3;
  const y = rect.top + rect.height / 2;
  const to = x + days * columnWidth(canvasElement);
  await pressAt(x, y);
  await moveTo(to, y);
  if (release) await releaseAt(to, y);
}

async function ashaAtlas(canvasElement: HTMLElement) {
  await expand(canvasElement, "Asha Rao");
  return within(canvasElement).findByRole("button", {
    name: "4h/day for 12 days",
  });
}

export const ResizeThenSaveEmitsEdit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    await expect(canvas.getByText("4h/day for 14 days")).toBeVisible();
    await expect(args.onEdit).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationId: "RA-0001",
        startDate: new Date(2026, 9, 19),
        endDate: new Date(2026, 10, 1),
        segmentEndDate: new Date(2026, 9, 30),
      }),
    );
  },
};

export const ResizeThenCancelPutsTheBarBack: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "start", 1);
    await expect(canvas.getByText("4h/day for 11 days")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(canvas.getByText("4h/day for 12 days")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  },
};

export const EscapeDiscardsAResizedBar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", -3);
    const resized = canvas.getByRole("button", { name: "4h/day for 9 days" });
    await waitFor(() => expect(resized).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("4h/day for 12 days")).toBeVisible();
  },
};

export const EscapeCancelsAResizeInProgress: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await dragEdge(
      canvasElement,
      await ashaAtlas(canvasElement),
      "end",
      2,
      false,
    );
    await expect(canvas.getByText("4h/day for 14 days")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("4h/day for 12 days")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  },
};

/** Rows the play function swaps, the way a page load or a refresh rebuilds them. */
const reloadedEmployees = shallowRef(EMPLOYEES);

const reloadableRows = {
  render: (args) => ({
    components: { GanttGrid },
    setup: () => ({ args, reloadedEmployees }),
    template: `
      <div class="h-[560px] w-full">
        <GanttGrid v-bind="args" :employees="reloadedEmployees" />
      </div>
    `,
  }),
} satisfies Story;

export const ReloadedRowsKeepAResize: Story = {
  ...reloadableRows,
  play: async ({ canvasElement }) => {
    reloadedEmployees.value = EMPLOYEES;
    const canvas = within(canvasElement);
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    reloadedEmployees.value = structuredClone(EMPLOYEES);
    await nextTick();
    await expect(canvas.getByText("4h/day for 14 days")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Save" })).toBeVisible();
  },
};

export const ReloadedRowsWithNewDatesReplaceAResize: Story = {
  ...reloadableRows,
  play: async ({ canvasElement }) => {
    reloadedEmployees.value = EMPLOYEES;
    const canvas = within(canvasElement);
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    const saved = structuredClone(EMPLOYEES);
    saved[0].projects![0].allocations![0].endDate = new Date(2026, 10, 1);
    reloadedEmployees.value = saved;
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Save" }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvas.getByText("4h/day for 14 days")).toBeVisible();
  },
};

export const RecurringAllocationsDontResize: Story = {
  play: async ({ canvasElement }) => {
    await expand(canvasElement, "Dana Ortiz");
    const recurring = await within(canvasElement).findByRole("button", {
      name: "8h/day for 5 days",
    });
    await dragEdge(canvasElement, recurring, "end", 2);
    await expect(recurring).toHaveAccessibleName("8h/day for 5 days");
  },
};

export const PendingResizeGuardsCollapsing: Story = {
  play: async ({ canvasElement, args }) => {
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    const asha = toggle(canvasElement, "Asha Rao");
    await userEvent.click(asha);
    const dialog = await screen.findByRole("dialog", { name: "Save Changes" });
    await expect(asha).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Discard Changes" }),
    );
    await expect(asha).toHaveAttribute("aria-expanded", "false");
    await expect(args.onEdit).not.toHaveBeenCalled();
  },
};

export const ClickingTheDimmedGridAsksFirst: Story = {
  play: async ({ canvasElement }) => {
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    const { x, y } = dayPoint(canvasElement, chen(canvasElement), 2);
    await userEvent.click(document.elementFromPoint(x, y)!);
    await expect(
      await screen.findByRole("dialog", { name: "Save Changes" }),
    ).toBeVisible();
  },
};

export const SaveChangesFromTheGuardOpensTheEdit: Story = {
  play: async ({ canvasElement, args }) => {
    await dragEdge(canvasElement, await ashaAtlas(canvasElement), "end", 2);
    await userEvent.click(toggle(canvasElement, "Asha Rao"));
    const dialog = await screen.findByRole("dialog", { name: "Save Changes" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );
    await expect(args.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ endDate: new Date(2026, 10, 1) }),
    );
  },
};

/** The middle of a day column in a row, `days` columns from the first. */
function dayPoint(
  canvasElement: HTMLElement,
  rowHeader: HTMLElement,
  days: number,
) {
  const row = rowHeader.getBoundingClientRect();
  const width = columnWidth(canvasElement);
  return {
    x: row.right + days * width + width / 2,
    y: row.top + row.height / 2,
  };
}

async function hoverDay(
  canvasElement: HTMLElement,
  rowHeader: HTMLElement,
  days: number,
) {
  const { x, y } = dayPoint(canvasElement, rowHeader, days);
  await fireEvent.pointerMove(document.elementFromPoint(x, y)!, {
    clientX: x,
    clientY: y,
    pointerId: 1,
  });
  return { x, y };
}

const chen = (canvasElement: HTMLElement) =>
  within(canvasElement).getByText("Chen Wei").closest("th")!;

/** The draft bar, named by its text: "Add allocation" and its hours. */
const NEW_ALLOCATION = /^Add allocation\s*\d+h$/;

async function drawDraft(canvasElement: HTMLElement, days: number) {
  const { x, y } = await hoverDay(canvasElement, chen(canvasElement), 1);
  const plus = await within(canvasElement).findByRole("button", {
    name: "Add allocation",
  });
  const to = x + days * columnWidth(canvasElement);
  await fireEvent.pointerDown(plus, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: "mouse",
  });
  await moveTo(to, y);
  await releaseAt(to, y);
}

export const DragFromPlusDrawsADraft: Story = {
  play: async ({ canvasElement, args }) => {
    await drawDraft(canvasElement, 2);
    await expect(args.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "HR-EMP-0003",
        employeeName: "Chen Wei",
        startDate: new Date(2026, 9, 20),
        endDate: new Date(2026, 9, 22),
        hoursPerDay: 8,
      }),
    );
    await expect(typeof mocked(args.onAdd!).mock.calls[0][0].onSuccess).toBe(
      "function",
    );
    const draft = within(canvasElement).getByRole("button", {
      name: NEW_ALLOCATION,
    });
    await expect(draft).toHaveTextContent("24h");
    await expect(draft).toHaveFocus();
  },
};

export const SavedDraftGoesAway: Story = {
  play: async ({ canvasElement, args }) => {
    await drawDraft(canvasElement, 0);
    const [[data]] = mocked(args.onAdd!).mock.calls;
    data.onSuccess?.();
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("button", { name: "New allocation" }),
      ).not.toBeInTheDocument(),
    );
  },
};

export const EscapeRemovesTheDraft: Story = {
  play: async ({ canvasElement }) => {
    await drawDraft(canvasElement, 1);
    await userEvent.keyboard("{Escape}");
    await expect(
      within(canvasElement).queryByRole("button", { name: "New allocation" }),
    ).not.toBeInTheDocument();
  },
};

export const RemoveButtonRemovesTheDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await drawDraft(canvasElement, 1);
    await expect(canvas.getByText("Oct 21")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Remove draft" }));
    await expect(
      canvas.queryByRole("button", { name: "New allocation" }),
    ).not.toBeInTheDocument();
  },
};

export const ResizingTheDraftAsksAgain: Story = {
  play: async ({ canvasElement, args }) => {
    await drawDraft(canvasElement, 0);
    const draft = within(canvasElement).getByRole("button", {
      name: NEW_ALLOCATION,
    });
    await dragEdge(canvasElement, draft, "end", 3);
    await expect(args.onAdd).toHaveBeenLastCalledWith(
      expect.objectContaining({
        startDate: new Date(2026, 9, 20),
        endDate: new Date(2026, 9, 23),
      }),
    );
  },
};

export const TouchPressDrawsADraft: Story = {
  play: async ({ canvasElement, args }) => {
    const { x, y } = dayPoint(canvasElement, chen(canvasElement), 3);
    await pressAt(x, y, { pointerType: "touch" });
    await releaseAt(x, y);
    await expect(args.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date(2026, 9, 22),
        endDate: new Date(2026, 9, 22),
      }),
    );
  },
};

export const EscapeWhileDrawingDropsTheDraft: Story = {
  play: async ({ canvasElement, args }) => {
    const { x, y } = await hoverDay(canvasElement, chen(canvasElement), 1);
    const plus = await within(canvasElement).findByRole("button", {
      name: "Add allocation",
    });
    await fireEvent.pointerDown(plus, {
      clientX: x,
      clientY: y,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      pointerType: "mouse",
    });
    await moveTo(x + 2 * columnWidth(canvasElement), y);
    await userEvent.keyboard("{Escape}");
    await expect(
      within(canvasElement).queryByRole("button", { name: "New allocation" }),
    ).not.toBeInTheDocument();
    await expect(args.onAdd).not.toHaveBeenCalled();
  },
};

export const BookedDaysShowNoPlus: Story = {
  play: async ({ canvasElement }) => {
    const dana = toggle(canvasElement, "Dana Ortiz").closest("th")!;
    // Dana is booked on the first Monday, then has the second week free.
    await hoverDay(canvasElement, dana, 0);
    await expect(
      within(canvasElement).queryByRole("button", { name: "Add allocation" }),
    ).not.toBeInTheDocument();
    await hoverDay(canvasElement, dana, 8);
    await expect(
      await within(canvasElement).findByRole("button", {
        name: "Add allocation",
      }),
    ).toBeVisible();
  },
};

export const ReadOnlyShowsNoPlus: Story = {
  args: { hasRoleAccess: false },
  play: async ({ canvasElement }) => {
    await hoverDay(canvasElement, chen(canvasElement), 1);
    await expect(
      within(canvasElement).queryByRole("button", { name: "Add allocation" }),
    ).not.toBeInTheDocument();
  },
};
