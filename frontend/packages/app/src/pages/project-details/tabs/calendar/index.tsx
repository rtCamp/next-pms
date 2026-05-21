/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, TabButtons } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { CalendarGrid } from "./calendarGrid";
import { CalendarToolbar, type CalendarView } from "./calendarToolbar";
import { getTimelineItems } from "./fake-data";
import { GanttView } from "./ganttView";
import { MilestonesTable } from "./milestonesTable";
import { TouchpointsTable } from "./touchpointsTable";

type TableTab = "milestones" | "touchpoints";

export function CalendarTab() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const items = getTimelineItems(projectId);

  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<CalendarView>("calendar");
  const [filterType, setFilterType] = useState("all");
  const [tableTab, setTableTab] = useState<TableTab>("milestones");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
            buttons={[
              { label: "Milestones", value: "milestones" },
              { label: "Touchpoints", value: "touchpoints" },
            ]}
          />

          <Button
            variant="solid"
            label="Create"
            iconLeft={() => <Plus className="size-3.5" />}
            onClick={() => {}}
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
    </div>
  );
}
