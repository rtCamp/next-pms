/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, TabButtons, useToasts } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { CalendarGrid } from "./calendarGrid";
import { CalendarToolbar, type CalendarView } from "./calendarToolbar";
import { CreateMilestoneModal } from "./create-milestone";
import { CreateTouchpointModal } from "./create-touchpoint";
import { GanttView } from "./ganttView";
import { MilestonesTable } from "./milestonesTable";
import { TouchpointsTable } from "./touchpointsTable";
import type { ProjectTimelineItem } from "./types";
import { useProjectTimelineItems } from "./useProjectTimelineItems";

type TableTab = "milestones" | "touchpoints";

export function CalendarTab() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const toast = useToasts();
  const { userId } = useUser(({ state }) => ({ userId: state.userId }));

  const { call: markComplete } = useFrappePostCall(
    "next_pms.next_projects.api.project_timeline_item.mark_timeline_item_complete",
  );

  const { call: updateFollow } = useFrappePostCall(
    "frappe.desk.form.document_follow.update_follow",
  );

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

  function handlePeriodChange(isoVal: string) {
    const d = parseISO(isoVal);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  }

  function goToPrev() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  }

  function goToNext() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  function goToToday() {
    const n = new Date();
    setCurrentDate(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDate(null);
  }

  async function handleMarkAsCompleted(item: ProjectTimelineItem) {
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
  }

  function handleEdit(item: ProjectTimelineItem) {
    setEditItem(item);
  }

  async function handleFollowDocument(item: ProjectTimelineItem) {
    const isFollowing = item.watchers.some((w) => w.name === userId);
    try {
      await updateFollow({
        doctype: "Project Timeline Item",
        doc_name: item.id,
        following: !isFollowing,
      });
      toast.success(isFollowing ? "Unfollowed document" : "Following document");
      void mutate();
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Calendar toolbar */}
      <div className="py-3.5">
        <CalendarToolbar
          currentPeriodValue={format(currentDate, "yyyy-MM-dd")}
          onPeriodChange={handlePeriodChange}
          onPrevious={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          activeView={activeView}
          onViewChange={setActiveView}
          filterValue={filterType}
          onFilterChange={setFilterType}
        />
      </div>

      {/* Calendar or Gantt view */}
      <div className="border-b border-gray-100 -mx-5">
        {activeView === "calendar" ? (
          <CalendarGrid
            year={year}
            month={month}
            items={filteredItems}
            selectedDate={selectedDate}
          />
        ) : (
          <GanttView year={year} month={month} items={filteredItems} />
        )}
      </div>

      {/* Table section */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-1 mb-3">
          <TabButtons
            value={tableTab}
            onChange={(val) => setTableTab(val as TableTab)}
            buttonClassName="text-ink-gray-5 data-pressed:text-ink-gray-8"
            buttons={[
              { label: "Milestones", value: "milestones" },
              { label: "Touchpoints", value: "touchpoints" },
            ]}
          />

          <Button
            variant="solid"
            label="Create"
            iconLeft={() => <Plus className="size-3.5" />}
            onClick={() => {
              if (tableTab === "milestones") {
                setCreateMilestoneOpen(true);
              } else {
                setCreateTouchpointOpen(true);
              }
            }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {tableTab === "milestones" ? (
            <MilestonesTable
              items={items}
              userId={userId}
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
              onFollowDocument={handleFollowDocument}
            />
          ) : (
            <TouchpointsTable
              items={items}
              userId={userId}
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
              onFollowDocument={handleFollowDocument}
            />
          )}
        </div>
      </div>

      <CreateMilestoneModal
        open={createMilestoneOpen}
        onOpenChange={setCreateMilestoneOpen}
        projectId={projectId}
        onSuccess={() => {
          void mutate();
        }}
      />

      <CreateTouchpointModal
        open={createTouchpointOpen}
        onOpenChange={setCreateTouchpointOpen}
        projectId={projectId}
        onSuccess={() => {
          void mutate();
        }}
      />

      {/* Edit modals — reuse create modals with item pre-filled */}
      <CreateMilestoneModal
        open={editItem?.type === "Milestone"}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        projectId={projectId}
        item={editItem?.type === "Milestone" ? editItem : undefined}
        onSuccess={() => {
          setEditItem(null);
          void mutate();
        }}
      />

      <CreateTouchpointModal
        open={editItem?.type === "Touchpoint"}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        projectId={projectId}
        item={editItem?.type === "Touchpoint" ? editItem : undefined}
        onSuccess={() => {
          setEditItem(null);
          void mutate();
        }}
      />
    </div>
  );
}
