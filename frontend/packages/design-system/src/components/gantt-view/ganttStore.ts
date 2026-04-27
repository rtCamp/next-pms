import { createContext, useContext } from "react";
import { addDays, startOfWeek } from "date-fns";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { CELL_WIDTH, ROW_HEADER_WIDTH } from "./constants";
import type { Member as BaseMember } from "./types";
import { prepareMemberBars } from "./utils";
import type { Member } from "./utils";
export type {
  Member,
  MemberAllocationBar,
  ProjectAllocationBar,
} from "./utils";

interface GanttProps {
  members: BaseMember[];
  showWeekend: boolean;
  startDate: Date;
  weekCount: number;
  hasRoleAccess: boolean;
}

interface GanttState extends GanttProps {
  sourceMembers: BaseMember[];
  // derived
  daysPerWeek: number;
  columnCount: number;
  columnWidth: number;
  weekStart: Date;
  weeks: number[];
  columns: number[];
  weekendColumns: number[];
  members: Member[];
  // ui state
  expandedRows: Set<number>;
  headerWidth: number;
  containerWidth: number;
  resizeHandleActive: boolean;

  toggleRow: (index: number) => void;
  setHeaderWidth: (width: number) => void;
  setContainerWidth: (width: number) => void;
  setResizeHandleActive: (active: boolean) => void;
  startResize: (startX: number) => void;
  syncProps: (nextProps: GanttProps) => void;
}

export type GanttStore = ReturnType<typeof createGanttStore>;

function buildDerivedState(
  sourceMembers: BaseMember[],
  showWeekend: boolean,
  startDate: Date,
  weekCount: number,
  headerWidth: number,
  containerWidth: number,
) {
  const daysPerWeek = showWeekend ? 7 : 5;
  const columnCount = weekCount * daysPerWeek;
  const shouldExpandColumns = weekCount <= 4;
  const availableTimelineWidth = Math.max(containerWidth - headerWidth, 0);
  const columnWidth = shouldExpandColumns
    ? Math.max(
        CELL_WIDTH,
        columnCount > 0 ? Math.floor(availableTimelineWidth / columnCount) : 0,
      )
    : CELL_WIDTH;
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
  const members = prepareMemberBars(
    sourceMembers,
    weekStart,
    columnCount,
    showWeekend,
    columnWidth,
  );

  return {
    daysPerWeek,
    columnCount,
    columnWidth,
    weekStart,
    weeks,
    columns,
    weekendColumns,
    members,
  };
}

export const createGanttStore = (initProps: GanttProps) => {
  const headerWidth = ROW_HEADER_WIDTH;
  const containerWidth = 0;
  const derivedState = buildDerivedState(
    initProps.members,
    initProps.showWeekend,
    initProps.startDate,
    initProps.weekCount,
    headerWidth,
    containerWidth,
  );

  return createStore<GanttState>()((set, get) => ({
    ...initProps,
    sourceMembers: initProps.members,
    ...derivedState,
    expandedRows: new Set(),
    headerWidth,
    containerWidth,
    resizeHandleActive: false,

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
      set((state) => {
        const nextHeaderWidth = width;
        return {
          headerWidth: nextHeaderWidth,
          ...buildDerivedState(
            state.sourceMembers,
            state.showWeekend,
            state.startDate,
            state.weekCount,
            nextHeaderWidth,
            state.containerWidth,
          ),
        };
      }),

    setContainerWidth: (width) =>
      set((state) => {
        const nextContainerWidth = width;
        return {
          containerWidth: nextContainerWidth,
          ...buildDerivedState(
            state.sourceMembers,
            state.showWeekend,
            state.startDate,
            state.weekCount,
            state.headerWidth,
            nextContainerWidth,
          ),
        };
      }),

    setResizeHandleActive: (active) => set({ resizeHandleActive: active }),

    startResize: (startX) => {
      const startWidth = get().headerWidth;
      set({ resizeHandleActive: true });

      const onPointerMove = (e: PointerEvent) => {
        get().setHeaderWidth(Math.max(120, startWidth + (e.clientX - startX)));
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
      set((state) => ({
        ...nextProps,
        sourceMembers: nextProps.members,
        ...buildDerivedState(
          nextProps.members,
          nextProps.showWeekend,
          nextProps.startDate,
          nextProps.weekCount,
          state.headerWidth,
          state.containerWidth,
        ),
        expandedRows: new Set(),
      }));
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
