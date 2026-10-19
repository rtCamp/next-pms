import type { Allocation, GanttEmployee, GanttProjectGroup } from "./types";

/** Monday of the first week shown. */
export const START_DATE = new Date(2026, 9, 19);

const day = (date: number, month = 9) => new Date(2026, month, date);

const ASHA = {
  id: "HR-EMP-0001",
  name: "Asha Rao",
  designation: "Senior Developer",
  department: "Engineering",
  rate: "₹1,200 / hour",
  capacity: "40h / week",
  capacityHoursPerDay: 8,
  manager: "Ravi Kumar",
};
const BEN = {
  id: "HR-EMP-0002",
  name: "Ben Ito",
  designation: "Product Designer",
  department: "Design",
  capacity: "40h / week",
  capacityHoursPerDay: 8,
};
const CHEN = {
  id: "HR-EMP-0003",
  name: "Chen Wei",
  designation: "QA Engineer",
  badge: "Intern",
  capacity: "30h / week",
  capacityHoursPerDay: 6,
};
const DANA = {
  id: "HR-EMP-0004",
  name: "Dana Ortiz",
  designation: "Engineering Manager",
};

const ATLAS = {
  id: "PROJ-0001",
  name: "Atlas Redesign",
  customer: "Acme Corp",
  dateRange: "Oct 1 - Nov 30",
  projectDateRange: "Sep 1, 2026 - Dec 31, 2026",
  projectManager: "Ravi Kumar",
  remainingHours: 312.5,
};
const BEACON = {
  id: "PROJ-0002",
  name: "Beacon API",
  customer: "Globex",
  dateRange: "Oct 15 - Nov 13",
  remainingHours: 80,
};

const UPDATED_BY = { name: "Ravi Kumar" };

const ASHA_ATLAS: Allocation = {
  id: "RA-0001",
  employeeId: ASHA.id,
  projectId: ATLAS.id,
  hours: 4,
  startDate: day(19),
  endDate: day(30),
  billable: true,
  createdOn: day(1),
  updatedOn: day(12),
  updatedBy: UPDATED_BY,
};
const ASHA_BEACON_TENTATIVE: Allocation = {
  id: "RA-0002",
  employeeId: ASHA.id,
  projectId: BEACON.id,
  hours: 4,
  startDate: day(19),
  endDate: day(23),
  billable: true,
  tentative: true,
  createdOn: day(5),
  updatedOn: day(5),
  updatedBy: UPDATED_BY,
};
const ASHA_BEACON_NON_BILLABLE: Allocation = {
  id: "RA-0003",
  employeeId: ASHA.id,
  projectId: BEACON.id,
  hours: 2,
  startDate: day(26),
  endDate: day(6, 10),
  billable: false,
  createdOn: day(5),
  updatedOn: day(5),
};
const BEN_ATLAS_AI: Allocation = {
  id: "RA-0004",
  employeeId: BEN.id,
  projectId: ATLAS.id,
  hours: 6,
  startDate: day(26),
  endDate: day(30),
  billable: true,
  isAiCreated: true,
  aiReason: "Ben is free that week and designed the first phase.",
  createdOn: day(14),
};
const DANA_ATLAS: Allocation = {
  id: "RA-0005",
  employeeId: DANA.id,
  projectId: ATLAS.id,
  hours: 6,
  startDate: day(19),
  endDate: day(23),
  billable: true,
};
const DANA_BEACON: Allocation = {
  id: "RA-0006",
  employeeId: DANA.id,
  projectId: BEACON.id,
  hours: 4,
  startDate: day(21),
  endDate: day(23),
  billable: true,
};
const DANA_BEACON_RECURRING: Allocation = {
  id: "RA-0007",
  employeeId: DANA.id,
  projectId: BEACON.id,
  recurrenceId: "REC-0001",
  hours: 8,
  startDate: day(2, 10),
  endDate: day(6, 10),
  billable: true,
};
const DANA_ATLAS_REDUCED: Allocation = {
  id: "RA-0008",
  employeeId: DANA.id,
  projectId: ATLAS.id,
  hours: 0,
  fullyReduced: true,
  allocationHoursPerDay: 4,
  startDate: day(26),
  endDate: day(28),
  billable: true,
};

const ASHA_LEAVE = { startDate: day(2, 10), endDate: day(3, 10) };
const ASHA_HOLIDAY = {
  startDate: day(21),
  endDate: day(21),
  label: "Dussehra",
};
const BEN_HALF_DAY = {
  startDate: day(20),
  endDate: day(20),
  halfDayDate: day(20),
  halfDayPortion: "second" as const,
};

/** `team` rows: booked, tentative, non-billable, AI-created, over capacity, free, and time off. */
export const EMPLOYEES: GanttEmployee[] = [
  {
    ...ASHA,
    projects: [
      { ...ATLAS, allocations: [ASHA_ATLAS] },
      {
        ...BEACON,
        allocations: [ASHA_BEACON_TENTATIVE, ASHA_BEACON_NON_BILLABLE],
      },
    ],
    leaves: [ASHA_LEAVE, ASHA_HOLIDAY],
  },
  {
    ...BEN,
    projects: [{ ...ATLAS, allocations: [BEN_ATLAS_AI] }],
    leaves: [BEN_HALF_DAY],
  },
  { ...CHEN, projects: [], leaves: [] },
  {
    ...DANA,
    projects: [
      { ...ATLAS, allocations: [DANA_ATLAS, DANA_ATLAS_REDUCED] },
      { ...BEACON, allocations: [DANA_BEACON, DANA_BEACON_RECURRING] },
    ],
  },
];

/** `project` rows: two staffed projects and one with nobody on it. */
export const PROJECTS: GanttProjectGroup[] = [
  {
    ...ATLAS,
    employees: [
      {
        ...ASHA,
        allocations: [ASHA_ATLAS],
        leaves: [ASHA_LEAVE, ASHA_HOLIDAY],
      },
      { ...BEN, allocations: [BEN_ATLAS_AI], leaves: [BEN_HALF_DAY] },
      { ...DANA, allocations: [DANA_ATLAS, DANA_ATLAS_REDUCED] },
    ],
  },
  {
    ...BEACON,
    employees: [
      {
        ...ASHA,
        allocations: [ASHA_BEACON_TENTATIVE, ASHA_BEACON_NON_BILLABLE],
        leaves: [ASHA_LEAVE, ASHA_HOLIDAY],
      },
      { ...DANA, allocations: [DANA_BEACON, DANA_BEACON_RECURRING] },
    ],
  },
  {
    id: "PROJ-0003",
    name: "Cosmos Support",
    customer: "Initech",
    badge: "New",
  },
];

/** Many rows, for scrolling and loading more. */
export const MANY_EMPLOYEES: GanttEmployee[] = Array.from(
  { length: 12 },
  (_, index) => ({
    ...EMPLOYEES[index % EMPLOYEES.length],
    id: `HR-EMP-${String(index + 100).padStart(4, "0")}`,
  }),
);
