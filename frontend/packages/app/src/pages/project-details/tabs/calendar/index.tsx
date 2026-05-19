/**
 * External dependencies.
 */
import { useState } from "react";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { CalendarToolbar, type CalendarView } from "./calendarToolbar";

export function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<CalendarView>("calendar");
  const [filterType, setFilterType] = useState("all");

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
    </div>
  );
}
