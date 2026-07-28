/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { parseISO } from "date-fns";
import {
  FrappeError,
  useFrappeDeleteDoc,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { CalendarContext, type CalendarContextProps } from "./context";
import type { CalendarView, ProjectTimelineItem, TableTab } from "./types";
import { useProjectTimelineItems } from "./useProjectTimelineItems";

interface CalendarProviderProps extends PropsWithChildren {
  projectId: string;
}

export function CalendarProvider({
  children,
  projectId,
}: CalendarProviderProps) {
  const toast = useToasts();
  const userId = useUser(({ state }) => state.userId);

  const { call: markComplete } = useFrappePostCall(
    "next_pms.next_projects.api.project_timeline_item.mark_timeline_item_complete",
  );

  const { call: updateFollow } = useFrappePostCall(
    "frappe.desk.form.document_follow.update_follow",
  );

  const { deleteDoc } = useFrappeDeleteDoc();

  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<CalendarView>("calendar");
  const [filterType, setFilterType] = useState("all");
  const [tableTab, setTableTab] = useState<TableTab>("milestones");
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [createTouchpointOpen, setCreateTouchpointOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectTimelineItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { items, mutate } = useProjectTimelineItems(projectId, year, month);

  const filteredItems =
    filterType === "all"
      ? items
      : items.filter((item) =>
          filterType === "milestones"
            ? item.type === "Milestone"
            : item.type === "Touchpoint",
        );

  const handlePeriodChange = useCallback((isoVal: string) => {
    const d = parseISO(isoVal);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  }, []);

  const goToToday = useCallback(() => {
    const n = new Date();
    setCurrentDate(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDate(null);
  }, []);

  const onMarkAsCompleted = useCallback(
    async (item: ProjectTimelineItem) => {
      try {
        await markComplete({
          name: item.id,
          is_complete: item.isComplete ? 0 : 1,
        });
        toast.success(
          item.isComplete ? "Marked as incomplete" : "Marked as completed",
        );
        void mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [markComplete, mutate, toast],
  );

  const onEdit = useCallback((item: ProjectTimelineItem) => {
    setEditItem(item);
  }, []);

  const closeEditItem = useCallback(() => {
    setEditItem(null);
  }, []);

  const onFollowDocument = useCallback(
    async (item: ProjectTimelineItem) => {
      const isFollowing = item.watchers.some((w) => w.name === userId);
      try {
        const res = await updateFollow({
          doctype: "Project Timeline Item",
          doc_name: item.id,
          following: !isFollowing,
        });
        if (!isFollowing && !res?.message) {
          toast.error("Document follow is not enabled for current user.");
          return;
        }
        toast.success(
          isFollowing ? "Unfollowed document" : "Following document",
        );
        void mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [mutate, toast, updateFollow, userId],
  );

  const onDelete = useCallback(
    async (item: ProjectTimelineItem) => {
      try {
        await deleteDoc("Project Timeline Item", item.id);
        toast.success(`${item.type} deleted`);
        void mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, mutate, toast],
  );

  const value = useMemo<CalendarContextProps>(
    () => ({
      state: {
        projectId,
        items,
        filteredItems,
        userId,
        currentDate,
        selectedDate,
        activeView,
        filterType,
        tableTab,
        year,
        month,
        createMilestoneOpen,
        createTouchpointOpen,
        editItem,
      },
      actions: {
        setActiveView,
        setFilterType,
        setTableTab,
        handlePeriodChange,
        goToPrev,
        goToNext,
        goToToday,
        onEdit,
        onMarkAsCompleted,
        onFollowDocument,
        onDelete,
        setCreateMilestoneOpen,
        setCreateTouchpointOpen,
        closeEditItem,
        mutate,
      },
    }),
    [
      projectId,
      items,
      filteredItems,
      userId,
      currentDate,
      selectedDate,
      activeView,
      filterType,
      tableTab,
      year,
      month,
      createMilestoneOpen,
      createTouchpointOpen,
      editItem,
      handlePeriodChange,
      goToPrev,
      goToNext,
      goToToday,
      onEdit,
      onMarkAsCompleted,
      onFollowDocument,
      onDelete,
      closeEditItem,
      mutate,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
