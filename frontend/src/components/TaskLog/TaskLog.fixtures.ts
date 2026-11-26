import type { TaskLogDetails, TaskLogEntry, TaskWorker } from "./types";

export const ASHA: TaskWorker = {
  employeeId: "HR-EMP-001",
  employeeName: "Asha Rao",
  image: null,
  totalHours: 6.5,
};
export const KABIR: TaskWorker = {
  employeeId: "HR-EMP-002",
  employeeName: "Kabir Nair",
  image: null,
  totalHours: 3.25,
};

export const DETAILS: TaskLogDetails = {
  subject: "Migrate the blog to the new CMS",
  status: "Working",
  projectName: "Blue Harbour CMS Migration",
  dueDate: "2026-10-30",
  actualHours: 9.75,
  estimatedHours: 12,
  workedBy: [ASHA, KABIR],
};

export const ENTRIES: TaskLogEntry[] = [
  {
    date: "2026-10-12",
    employee: ASHA,
    description: "<p>Moved the <strong>author pages</strong>.</p>",
    hours: 4,
  },
  {
    date: "2026-10-09",
    employee: KABIR,
    description: "<p>Redirect map for old URLs.</p>",
    hours: 3.25,
  },
  {
    date: "2026-10-08",
    employee: ASHA,
    description: "<p>Content export.</p>",
    hours: 2.5,
  },
];
