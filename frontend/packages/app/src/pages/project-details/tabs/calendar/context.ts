/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { CalendarView, ProjectTimelineItem, TableTab } from "./types";

export interface CalendarContextProps {
  state: {
    items: ProjectTimelineItem[];
    filteredItems: ProjectTimelineItem[];
    userId?: string;
    currentDate: Date;
    selectedDate: Date | null;
    activeView: CalendarView;
    filterType: string;
    tableTab: TableTab;
    year: number;
    month: number;
    createMilestoneOpen: boolean;
    createTouchpointOpen: boolean;
    editItem: ProjectTimelineItem | null;
  };
  actions: {
    setActiveView: (view: CalendarView) => void;
    setFilterType: (value: string) => void;
    setTableTab: (tab: TableTab) => void;
    handlePeriodChange: (isoVal: string) => void;
    goToPrev: () => void;
    goToNext: () => void;
    goToToday: () => void;
    onEdit: (item: ProjectTimelineItem) => void;
    onMarkAsCompleted: (item: ProjectTimelineItem) => Promise<void>;
    onFollowDocument: (item: ProjectTimelineItem) => Promise<void>;
    onDelete: (item: ProjectTimelineItem) => Promise<void>;
    setCreateMilestoneOpen: (open: boolean) => void;
    setCreateTouchpointOpen: (open: boolean) => void;
    closeEditItem: () => void;
    mutate: () => void;
  };
}

const noop = () => {};

export const CalendarContext = createContext<CalendarContextProps>({
  state: {
    items: [],
    filteredItems: [],
    userId: undefined,
    currentDate: new Date(),
    selectedDate: null,
    activeView: "calendar",
    filterType: "all",
    tableTab: "milestones",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    createMilestoneOpen: false,
    createTouchpointOpen: false,
    editItem: null,
  },
  actions: {
    setActiveView: noop,
    setFilterType: noop,
    setTableTab: noop,
    handlePeriodChange: noop,
    goToPrev: noop,
    goToNext: noop,
    goToToday: noop,
    onEdit: noop,
    onMarkAsCompleted: async () => {},
    onFollowDocument: async () => {},
    onDelete: async () => {},
    setCreateMilestoneOpen: noop,
    setCreateTouchpointOpen: noop,
    closeEditItem: noop,
    mutate: noop,
  },
});

export const useCalendar = <T>(selector: (state: CalendarContextProps) => T) =>
  useContextSelector(CalendarContext, selector);
