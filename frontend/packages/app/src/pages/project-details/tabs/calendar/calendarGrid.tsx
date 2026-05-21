/**
 * External dependencies.
 */
import { format, isSameDay, isSameMonth, isToday } from "date-fns";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { DAY_HEADERS } from "./constants";
import { EventPill } from "./eventPill";
import type { ProjectTimelineItem } from "./types";
import { getCalendarWeeks, groupByDate } from "./utils";

type CalendarGridProps = {
  year: number;
  month: number;
  items: ProjectTimelineItem[];
  selectedDate?: Date | null;
};

export function CalendarGrid({
  year,
  month,
  items,
  selectedDate,
}: CalendarGridProps) {
  const weeks = getCalendarWeeks(year, month);
  const byDate = groupByDate(items);
  const currentMonth = new Date(year, month, 1);

  return (
    <div className="flex flex-col">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-outline-gray-1">
        {DAY_HEADERS.map((day) => {
          return (
            <div
              key={day}
              className="py-2 text-center text-base text-ink-gray-6"
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Weeks */}
      <div className="flex flex-col flex-1">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 border-b border-outline-gray-1 last:border-b-0"
          >
            {week.map((day, di) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayItems = byDate.get(dateKey) ?? [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected = selectedDate
                ? isSameDay(day, selectedDate)
                : false;
              // di is 0=Mon…4=Fri, 5=Sat, 6=Sun (weekStartsOn:1)
              const isWeekend = di >= 5;

              return (
                <div
                  key={di}
                  className={mergeClassNames(
                    "min-h-17.5 p-1.5 border-r border-outline-gray-1 last:border-r-0 flex flex-col gap-1",
                    isWeekend && "bg-surface-gray-1",
                    isSelected && !today && "bg-surface-blue-1",
                  )}
                >
                  {/* Day number */}
                  <div className="flex justify-end">
                    <span
                      className={mergeClassNames(
                        "text-base w-6 h-6 flex items-center justify-center rounded",
                        today
                          ? "bg-surface-red-5 text-white"
                          : isSelected
                            ? "ring-1 ring-outline-blue-1"
                            : isCurrentMonth
                              ? "text-ink-gray-6"
                              : "text-ink-gray-4",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-0.5">
                    {dayItems.map((item) => (
                      <EventPill
                        key={item.id}
                        item={item}
                        truncate={dayItems.length > 1}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
