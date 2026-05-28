import { createContext, useContext } from "react";
import { addDays, startOfWeek } from "date-fns";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { CELL_WIDTH, ROW_HEADER_WIDTH } from "./constants";
import type {
  AllocationCallbackData,
  GanttGridVariant,
  Member as BaseMember,
  ProjectGroup as BaseProjectGroup,
} from "./types";
import { prepareMemberBars, prepareProjectBars } from "./utils";
import type { Member, ProjectGroup } from "./utils";
export type {
  Member,
  MemberSummaryBar,
  ProjectGroup,
  ProjectSummaryBar,
  ProjectMember,
  ProjectMemberAllocationBar,
  ProjectAllocationBar,
} from "./utils";

export interface PendingDeleteEntry {
  projectName: string;
  dateRange: string;
  hoursPerDay: string;
  totalHours: string;
  onDelete: () => void;
}

export interface GanttActiveEdit {
  save: () => void;
  discard: () => void;
}

interface GanttProps {
  variant: GanttGridVariant;
  members?: BaseMember[];
  projects?: BaseProjectGroup[];
  rowHeaderLabel: string;
  showWeekend: boolean;
  startDate: Date;
  weekCount: number;
  hasRoleAccess: boolean;
  onAddAllocation?: (data: AllocationCallbackData) => void;
  onEditAllocation?: (data: AllocationCallbackData) => void;
  onDeleteAllocation?: (data: AllocationCallbackData) => void;
}

interface GanttState extends GanttProps {
  sourceMembers: BaseMember[];
  sourceProjects: BaseProjectGroup[];
  // derived
  daysPerWeek: number;
  columnCount: number;
  columnWidth: number;
  weekStart: Date;
  weeks: number[];
  columns: number[];
  weekendColumns: number[];
  members: Member[];
  projects: ProjectGroup[];
  // ui state
  expandedRows: Set<number>;
  headerWidth: number;
  containerWidth: number;
  resizeHandleActive: boolean;
  pendingDeleteEntry: PendingDeleteEntry | null;
  activeEdit: GanttActiveEdit | null;

  toggleRow: (index: number) => void;
  setPendingDeleteEntry: (entry: PendingDeleteEntry) => void;
  clearPendingDeleteEntry: () => void;
  setActiveEdit: (actions: GanttActiveEdit) => void;
  clearActiveEdit: (actions: GanttActiveEdit) => void;
  setHeaderWidth: (width: number) => void;
  setContainerWidth: (width: number) => void;
  setResizeHandleActive: (active: boolean) => void;
  startResize: (startX: number) => void;
  syncProps: (nextProps: GanttProps) => void;
}

export type GanttStore = ReturnType<typeof createGanttStore>;

/**
 * Extracts source members from props based on the current variant.
 */
function getSourceMembers(props: GanttProps) {
  return props.variant === "team" ? (props.members ?? []) : [];
}

/**
 * Extracts source projects from props based on the current variant.
 */
function getSourceProjects(props: GanttProps) {
  return props.variant === "project" ? (props.projects ?? []) : [];
}

/**
 * Rounds a width and clamps it to a minimum value.
 */
function normalizeWidth(width: number, minWidth: number) {
  return Math.max(minWidth, Math.round(width));
}

/**
 * Calculates the effective width of each timeline column.
 */
function getColumnWidth(
  weekCount: number,
  daysPerWeek: number,
  headerWidth: number,
  containerWidth: number,
) {
  const columnCount = weekCount * daysPerWeek;
  const shouldExpandColumns = weekCount <= 4;
  const availableTimelineWidth = Math.max(containerWidth - headerWidth, 0);

  if (!shouldExpandColumns) {
    return CELL_WIDTH;
  }

  return Math.max(
    CELL_WIDTH,
    columnCount > 0 ? Math.floor(availableTimelineWidth / columnCount) : 0,
  );
}

/**
 * Returns a stable key for a member row.
 */
function getMemberStableKey(member: BaseMember) {
  return (
    member.id ??
    `${member.name}::${member.designation ?? ""}::${member.image ?? ""}`
  );
}

/**
 * Returns a stable key for a project row.
 */
function getProjectStableKey(project: BaseProjectGroup) {
  return project.id ?? `${project.name}::${project.client ?? ""}`;
}

/**
 * Applies header/container sizing updates and derived-state recomputation.
 */
function resolveSizingUpdate(
  state: GanttState,
  next: {
    headerWidth?: number;
    containerWidth?: number;
  },
): GanttState | Partial<GanttState> {
  const nextHeaderWidth =
    next.headerWidth === undefined
      ? state.headerWidth
      : normalizeWidth(next.headerWidth, 120);
  const nextContainerWidth =
    next.containerWidth === undefined
      ? state.containerWidth
      : normalizeWidth(next.containerWidth, 0);

  const hasHeaderChange = nextHeaderWidth !== state.headerWidth;
  const hasContainerChange = nextContainerWidth !== state.containerWidth;

  if (!hasHeaderChange && !hasContainerChange) {
    return state;
  }

  const nextColumnWidth = getColumnWidth(
    state.weekCount,
    state.daysPerWeek,
    nextHeaderWidth,
    nextContainerWidth,
  );

  if (nextColumnWidth === state.columnWidth) {
    return {
      ...(hasHeaderChange ? { headerWidth: nextHeaderWidth } : {}),
      ...(hasContainerChange ? { containerWidth: nextContainerWidth } : {}),
    };
  }

  return {
    ...(hasHeaderChange ? { headerWidth: nextHeaderWidth } : {}),
    ...(hasContainerChange ? { containerWidth: nextContainerWidth } : {}),
    ...buildDerivedState(
      state.variant,
      state.sourceMembers,
      state.sourceProjects,
      state.showWeekend,
      state.startDate,
      state.weekCount,
      nextHeaderWidth,
      nextContainerWidth,
    ),
  };
}

/**
 * Builds derived grid state from source members and view settings.
 */
function buildDerivedState(
  variant: GanttGridVariant,
  sourceMembers: BaseMember[],
  sourceProjects: BaseProjectGroup[],
  showWeekend: boolean,
  startDate: Date,
  weekCount: number,
  headerWidth: number,
  containerWidth: number,
) {
  const daysPerWeek = showWeekend ? 7 : 5;
  const columnCount = weekCount * daysPerWeek;
  const columnWidth = getColumnWidth(
    weekCount,
    daysPerWeek,
    headerWidth,
    containerWidth,
  );
  const weekStart = startOfWeek(startDate, {
    weekStartsOn: 1,
  });
  const weeks = Array.from({ length: weekCount }, (_, i) => i);
  const columns = Array.from({ length: columnCount }, (_, i) => i);
  const weekendColumns = showWeekend
    ? columns.filter((colIndex) => {
        const day = addDays(weekStart, colIndex);
        const dayOfWeek = day.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      })
    : [];
  const members =
    variant === "team"
      ? prepareMemberBars(
          sourceMembers,
          weekStart,
          columnCount,
          showWeekend,
          columnWidth,
        )
      : [];
  const projects =
    variant === "project"
      ? prepareProjectBars(
          sourceProjects,
          weekStart,
          columnCount,
          showWeekend,
          columnWidth,
        )
      : [];

  return {
    daysPerWeek,
    columnCount,
    columnWidth,
    weekStart,
    weeks,
    columns,
    weekendColumns,
    members,
    projects,
  };
}

export const createGanttStore = (initProps: GanttProps) => {
  const headerWidth = ROW_HEADER_WIDTH;
  const containerWidth = 0;
  const sourceMembers = getSourceMembers(initProps);
  const sourceProjects = getSourceProjects(initProps);
  const derivedState = buildDerivedState(
    initProps.variant,
    sourceMembers,
    sourceProjects,
    initProps.showWeekend,
    initProps.startDate,
    initProps.weekCount,
    headerWidth,
    containerWidth,
  );

  return createStore<GanttState>()((set, get) => ({
    ...initProps,
    sourceMembers,
    sourceProjects,
    ...derivedState,
    expandedRows: new Set(),
    headerWidth,
    containerWidth,
    resizeHandleActive: false,
    pendingDeleteEntry: null,
    activeEdit: null,

    toggleRow: (index) =>
      set((state) => {
        const next = new Set(state.expandedRows);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return { expandedRows: next };
      }),

    setHeaderWidth: (width) =>
      set((state) => resolveSizingUpdate(state, { headerWidth: width })),

    setContainerWidth: (width) =>
      set((state) => resolveSizingUpdate(state, { containerWidth: width })),

    setResizeHandleActive: (active) => set({ resizeHandleActive: active }),

    setPendingDeleteEntry: (entry) => set({ pendingDeleteEntry: entry }),
    clearPendingDeleteEntry: () => set({ pendingDeleteEntry: null }),

    setActiveEdit: (actions) =>
      set((state) =>
        state.activeEdit === actions ? state : { activeEdit: actions },
      ),

    clearActiveEdit: (actions) =>
      set((state) =>
        state.activeEdit === actions ? { activeEdit: null } : state,
      ),

    startResize: (startX) => {
      const startWidth = get().headerWidth;
      set({ resizeHandleActive: true });

      const onPointerMove = (e: PointerEvent) => {
        get().setHeaderWidth(startWidth + (e.clientX - startX));
      };

      const stopResize = () => {
        set({ resizeHandleActive: false });
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", stopResize);
        document.removeEventListener("pointercancel", stopResize);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", stopResize);
      document.addEventListener("pointercancel", stopResize);
    },

    syncProps: (nextProps) => {
      set((state) => {
        const nextSourceMembers = getSourceMembers(nextProps);
        const nextSourceProjects = getSourceProjects(nextProps);
        const nextRowIndexByKey = new Map<string, number>();
        const nextSourceRows =
          nextProps.variant === "team" ? nextSourceMembers : nextSourceProjects;
        const currentSourceRows =
          state.variant === "team" ? state.sourceMembers : state.sourceProjects;

        nextSourceRows.forEach((row, index) => {
          const rowKey =
            nextProps.variant === "team"
              ? getMemberStableKey(row)
              : getProjectStableKey(row);
          if (!nextRowIndexByKey.has(rowKey)) {
            nextRowIndexByKey.set(rowKey, index);
          }
        });

        const nextExpandedRows = new Set<number>();
        currentSourceRows.forEach((row, previousIndex) => {
          if (!state.expandedRows.has(previousIndex)) {
            return;
          }

          const rowKey =
            state.variant === "team"
              ? getMemberStableKey(row)
              : getProjectStableKey(row);
          const nextIndex = nextRowIndexByKey.get(rowKey);
          if (nextIndex !== undefined) {
            nextExpandedRows.add(nextIndex);
          }
        });

        return {
          ...nextProps,
          sourceMembers: nextSourceMembers,
          sourceProjects: nextSourceProjects,
          ...buildDerivedState(
            nextProps.variant,
            nextSourceMembers,
            nextSourceProjects,
            nextProps.showWeekend,
            nextProps.startDate,
            nextProps.weekCount,
            state.headerWidth,
            state.containerWidth,
          ),
          expandedRows: nextExpandedRows,
        };
      });
    },
  }));
};

export const GanttContext = createContext<GanttStore | null>(null);

export function useGanttStore<T>(
  selector: (state: GanttState) => T,
  deep?: true,
): T {
  const store = useContext(GanttContext);
  if (!store) throw new Error("Missing GanttContext.Provider in the tree");
  const shallowSelector = useShallow(selector);
  return useStore(store, deep ? selector : shallowSelector);
}
