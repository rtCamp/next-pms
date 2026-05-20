/**
 * External dependencies.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { CalendarGrid } from "./calendarGrid";
import { CalendarToolbar, type CalendarView } from "./calendarToolbar";
import { getTimelineItems } from "./fake-data";
import { GanttView } from "./ganttView";

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
    </div>
  );
}
