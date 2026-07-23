/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";
import { Button, TabButtons } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CalendarGrid } from "./calendarGrid";
import { CalendarToolbar } from "./calendarToolbar";
import { useCalendar } from "./context";
import { CreateMilestoneModal } from "./create-milestone";
import { CreateTouchpointModal } from "./create-touchpoint";
import { GanttView } from "./ganttView";
import { MilestonesTable } from "./milestonesTable";
import { CalendarProvider } from "./provider";
import { TouchpointsTable } from "./touchpointsTable";
import type { TableTab } from "./types";

function CalendarContent({ projectId }: { projectId: string }) {
  const activeView = useCalendar((c) => c.state.activeView);
  const tableTab = useCalendar((c) => c.state.tableTab);
  const items = useCalendar((c) => c.state.items);
  const editItem = useCalendar((c) => c.state.editItem);
  const createMilestoneOpen = useCalendar((c) => c.state.createMilestoneOpen);
  const createTouchpointOpen = useCalendar((c) => c.state.createTouchpointOpen);
  const setTableTab = useCalendar((c) => c.actions.setTableTab);
  const setCreateMilestoneOpen = useCalendar(
    (c) => c.actions.setCreateMilestoneOpen,
  );
  const setCreateTouchpointOpen = useCalendar(
    (c) => c.actions.setCreateTouchpointOpen,
  );
  const closeEditItem = useCalendar((c) => c.actions.closeEditItem);
  const mutate = useCalendar((c) => c.actions.mutate);

  return (
    <div className="flex flex-col gap-0">
      {/* Calendar toolbar */}
      <div className="py-3.5">
        <CalendarToolbar />
      </div>

      {/* Calendar or Gantt view */}
      <div className="border-b border-gray-100 -mx-5">
        {activeView === "calendar" ? <CalendarGrid /> : <GanttView />}
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
            iconLeft={() => <AddSm className="size-3.5" />}
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
            <MilestonesTable items={items} />
          ) : (
            <TouchpointsTable items={items} />
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
          if (!open) closeEditItem();
        }}
        projectId={projectId}
        item={editItem?.type === "Milestone" ? editItem : undefined}
        onSuccess={() => {
          closeEditItem();
          void mutate();
        }}
      />

      <CreateTouchpointModal
        open={editItem?.type === "Touchpoint"}
        onOpenChange={(open) => {
          if (!open) closeEditItem();
        }}
        projectId={projectId}
        item={editItem?.type === "Touchpoint" ? editItem : undefined}
        onSuccess={() => {
          closeEditItem();
          void mutate();
        }}
      />
    </div>
  );
}

export function CalendarTab() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  return (
    <CalendarProvider>
      <CalendarContent projectId={projectId} />
    </CalendarProvider>
  );
}
