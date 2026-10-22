import { describe, expect, it } from "vitest";
import {
  allocationEditLocks,
  allocationPayload,
  computeTotalHours,
  emptyAllocationForm,
  formFromRequest,
  formRefreshTargets,
  lastBookedDate,
  validateAllocationForm,
  type AllocationFormContext,
} from "./allocationForm";

const today = new Date(2026, 9, 22);

const segment = {
  allocationId: "RA-1",
  employeeId: "EMP-1",
  employeeName: "Asha Rao",
  projectId: "PROJ-1",
  projectName: "Atlas",
  customerName: "Acme Corp",
  startDate: new Date(2026, 9, 20),
  endDate: new Date(2026, 9, 21),
  hoursPerDay: 4,
  billable: false,
  tentative: true,
  note: "n",
  allocationStartDate: new Date(2026, 9, 19),
  allocationEndDate: new Date(2026, 9, 23),
  allocationHoursPerDay: 6,
};

const context = (
  overrides: Partial<AllocationFormContext> = {},
): AllocationFormContext => ({
  isAiCreated: false,
  override: [],
  ...overrides,
});

describe("formFromRequest", () => {
  it("opens an add with today's date and no hours", () => {
    const { form } = formFromRequest("add", {}, undefined, today);
    expect(form).toEqual(emptyAllocationForm(today));
    expect(form.fromDate).toBe("2026-10-22");
  });

  it("opens an add from a draft with its row, days and hours", () => {
    const { form } = formFromRequest(
      "add",
      {
        employeeId: "EMP-1",
        employeeName: "Asha Rao",
        projectId: "PROJ-1",
        projectName: "Atlas",
        customerName: "Acme Corp",
        startDate: new Date(2026, 9, 26),
        endDate: new Date(2026, 9, 28),
        hoursPerDay: 8,
      },
      "CUST-1",
      today,
    );
    expect(form).toMatchObject({
      employeeId: "EMP-1",
      employeeLabel: "Asha Rao",
      projectLabel: "Atlas",
      customerId: "CUST-1",
      customerLabel: "Acme Corp",
      fromDate: "2026-10-26",
      toDate: "2026-10-28",
      hoursPerDay: 8,
    });
  });

  it("edits a plain allocation's segment", () => {
    const { form, context: editContext } = formFromRequest(
      "edit",
      segment,
      "CUST-1",
      today,
    );
    expect(form).toMatchObject({
      recurrence: "one-time",
      fromDate: "2026-10-20",
      toDate: "2026-10-21",
      hoursPerDay: 4,
      isBillable: false,
      isTentative: true,
      note: "n",
    });
    expect(editContext).toMatchObject({
      allocationId: "RA-1",
      allocationStartDate: "2026-10-19",
      allocationEndDate: "2026-10-23",
      allocationHoursPerDay: 6,
      initialEmployeeId: "EMP-1",
    });
  });

  it("edits a recurring or AI allocation whole, and approves it confirmed", () => {
    const { form } = formFromRequest(
      "edit",
      { ...segment, isAiCreated: true },
      "CUST-1",
      today,
    );
    expect(form).toMatchObject({
      fromDate: "2026-10-19",
      toDate: "2026-10-23",
      hoursPerDay: 6,
      isTentative: false,
    });
    expect(
      formFromRequest("edit", { ...segment, recurrenceId: "R" }, "C", today)
        .form.recurrence,
    ).toBe("recurring");
  });
});

describe("allocationEditLocks", () => {
  it("leaves an add unlocked", () => {
    expect(
      allocationEditLocks("add", context({ recurrenceId: "R" })),
    ).toMatchObject({ isMetadataLocked: false, isHoursPerDayLocked: false });
  });

  it("locks a recurring edit for approval too", () => {
    expect(
      allocationEditLocks("edit", context({ recurrenceId: "R" })),
    ).toMatchObject({
      isRecurringEdit: true,
      isMetadataLocked: true,
      isHoursPerDayLocked: true,
      canApproveLocked: false,
    });
  });

  it("locks an allocation with overrides, leave-owned ones included", () => {
    expect(
      allocationEditLocks(
        "edit",
        context({ override: [{ date: "2026-10-20", source: "Leave" }] }),
      ),
    ).toMatchObject({ isMetadataLocked: true, hasLeaveOwnedOverrides: true });
  });

  it("keeps an AI allocation editable, but its hours locked by manual overrides", () => {
    expect(
      allocationEditLocks(
        "edit",
        context({
          isAiCreated: true,
          override: [{ date: "2026-10-20", hours: 2, source: "Manual" }],
        }),
      ),
    ).toMatchObject({
      isMetadataLocked: false,
      isHoursPerDayLocked: true,
      canApproveLocked: true,
    });
    expect(
      allocationEditLocks(
        "edit",
        context({
          isAiCreated: true,
          override: [{ date: "2026-10-20", hours: 4, source: "Leave" }],
        }),
      ).isHoursPerDayLocked,
    ).toBe(false);
  });
});

describe("validateAllocationForm", () => {
  it("reports React's messages", () => {
    expect(
      validateAllocationForm({
        ...emptyAllocationForm(today),
        recurrence: "recurring",
        repeatFor: null,
      }),
    ).toEqual({
      employeeId: "Please select an employee.",
      projectId: "Please select a project.",
      customerId: "This project doesn't have a customer set.",
      hoursPerDay: "Must be greater than 0.",
      repeatFor: "Must be at least 1.",
    });
  });

  it("checks the date order", () => {
    expect(
      validateAllocationForm({
        ...emptyAllocationForm(today),
        fromDate: "2026-10-23",
        toDate: "2026-10-19",
      }).toDate,
    ).toBe("End date must be on or after start date.");
    expect(
      validateAllocationForm({ ...emptyAllocationForm(today), fromDate: "" })
        .fromDate,
    ).toBe("Please select a start and end date.");
  });
});

describe("computeTotalHours", () => {
  const base = {
    hoursPerDay: 8,
    recurrence: "one-time" as const,
    fromDate: "2026-10-23",
    toDate: "2026-10-26",
    repeatFor: 1,
    includeWeekends: false,
    includeHolidays: false,
  };

  it("counts booked days only", () => {
    expect(computeTotalHours(base)).toBe(16);
    expect(computeTotalHours({ ...base, includeWeekends: true })).toBe(32);
  });

  it("counts each weekly copy and reduces days off", () => {
    expect(
      computeTotalHours({
        ...base,
        recurrence: "recurring",
        repeatFor: 2,
        availability: {
          "2026-10-30": { availabilityFactor: 0.5, isHoliday: false },
        },
      }),
    ).toBe(44);
    expect(
      computeTotalHours({
        ...base,
        includeHolidays: true,
        availability: {
          "2026-10-23": { availabilityFactor: 0, isHoliday: true },
        },
      }),
    ).toBe(16);
  });

  it("is zero for an invalid range", () => {
    expect(computeTotalHours({ ...base, toDate: "2026-10-01" })).toBe(0);
  });
});

describe("lastBookedDate", () => {
  it("moves the end by the recurring copies", () => {
    const form = { ...emptyAllocationForm(today), toDate: "2026-10-23" };
    expect(lastBookedDate(form)).toBe("2026-10-23");
    expect(
      lastBookedDate({ ...form, recurrence: "recurring", repeatFor: 2 }),
    ).toBe("2026-11-06");
  });
});

describe("allocationPayload", () => {
  it("builds the allocation, approving an AI one", () => {
    const form = {
      ...emptyAllocationForm(today),
      employeeId: "EMP-1",
      projectId: "PROJ-1",
      customerId: "CUST-1",
      hoursPerDay: 6,
      isBillable: false,
      isTentative: true,
    };
    expect(allocationPayload(form, context())).toEqual({
      doctype: "Resource Allocation",
      employee: "EMP-1",
      project: "PROJ-1",
      customer: "CUST-1",
      allocation_start_date: "2026-10-22",
      allocation_end_date: "2026-10-22",
      hours_allocated_per_day: 6,
      include_weekends: false,
      include_holidays: false,
      is_billable: 0,
      status: "Tentative",
      note: "",
    });
    expect(
      allocationPayload(form, context({ isAiCreated: true })).is_ai_created,
    ).toBe(0);
  });
});

describe("formRefreshTargets", () => {
  it("lists the employees and projects before and after", () => {
    expect(
      formRefreshTargets(
        { ...emptyAllocationForm(today), employeeId: "E2", projectId: "P1" },
        context({ initialEmployeeId: "E1", initialProjectId: "P1" }),
      ),
    ).toEqual({ employeeIds: ["E1", "E2"], projectIds: ["P1"] });
    expect(
      formRefreshTargets(emptyAllocationForm(today), context()),
    ).toBeUndefined();
  });
});
