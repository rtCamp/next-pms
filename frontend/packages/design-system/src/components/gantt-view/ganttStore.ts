import { createContext, useContext } from "react";
import { addDays, startOfWeek } from "date-fns";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { ROW_HEADER_WIDTH } from "./constants";
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
  // derived
  daysPerWeek: number;
  columnCount: number;
  weekStart: Date;
  weeks: number[];
  columns: number[];
  weekendColumns: number[];
  members: Member[];
  // ui state
  expandedRows: Set<number>;
  headerWidth: number;
  resizeHandleActive: boolean;

  toggleRow: (index: number) => void;
  setHeaderWidth: (width: number) => void;
  setResizeHandleActive: (active: boolean) => void;
  startResize: (startX: number) => void;
}

export type GanttStore = ReturnType<typeof createGanttStore>;

export const createGanttStore = (initProps: GanttProps) => {
  const daysPerWeek = initProps.showWeekend ? 7 : 5;
  const columnCount = initProps.weekCount * daysPerWeek;
  const weekStart = startOfWeek(initProps.startDate, {
    weekStartsOn: 1,
  });
  const weeks = Array.from({ length: initProps.weekCount }, (_, i) => i);
  const columns = Array.from({ length: columnCount }, (_, i) => i);
  const weekendColumns = initProps.showWeekend
    ? columns.filter((colIndex) => {
        const day = addDays(weekStart, colIndex);
        const dayOfWeek = day.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      })
    : [];
  const members = prepareMemberBars(
    initProps.members,
    weekStart,
    columnCount,
    initProps.showWeekend,
  );

  return createStore<GanttState>()((set, get) => ({
    ...initProps,
    daysPerWeek,
    columnCount,
    weekStart,
    weeks,
    columns,
    weekendColumns,
    members,
    expandedRows: new Set(),
    headerWidth: ROW_HEADER_WIDTH,
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

    setHeaderWidth: (width) => set({ headerWidth: width }),

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
