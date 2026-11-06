import type { CalendarTimelineEvent } from "./types";

export const RANGE_START = new Date(2026, 9, 12);
export const TODAY = new Date(2026, 9, 14);

export const EVENTS: CalendarTimelineEvent[] = [
  {
    id: "1",
    title: "Kick-off call",
    subtitle: "Acme Website",
    date: "2026-10-12",
    color: "blue",
  },
  {
    id: "2",
    title: "Design sign-off",
    subtitle: "Acme Website",
    date: "2026-10-14",
    color: "violet",
  },
  {
    id: "3",
    title: "Sprint review",
    subtitle: "Globex Mobile App",
    date: "2026-10-14",
  },
  { id: "4", title: "Launch", date: "2026-10-20", color: "violet" },
  {
    id: "5",
    title: "Quarterly business review with stakeholders",
    subtitle: "Initech Data Platform Migration",
    date: "2026-10-22",
    color: "blue",
  },
];
