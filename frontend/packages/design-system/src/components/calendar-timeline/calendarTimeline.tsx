/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { format, isSameDay } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Internal dependencies.
 */
import { DEFAULT_VISIBLE_DAYS, WEEKEND_DAY_INDICES } from "./constants";
import EventChip from "./eventChip";
import type { CalendarTimelineProps } from "./types";
import { getRangeLabel, getVisibleDays, groupEventsByDay } from "./utils";
import { mergeClassNames as cn } from "../../utils";

const CalendarTimeline = ({
  events,
  rangeStart,
  days = DEFAULT_VISIBLE_DAYS,
  today,
  rangeLabel,
  filterSlot,
  headerSlot,
  onPrev,
  onNext,
  onToday,
}: CalendarTimelineProps) => {
  const visibleDays = useMemo(
    () => getVisibleDays(rangeStart, days),
    [rangeStart, days],
  );
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const label = rangeLabel ?? getRangeLabel(rangeStart, days);
  const columnStyle = {
    gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))`,
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        {headerSlot ?? (
          <>
            <div className="flex items-center gap-1 text-base font-medium text-ink-gray-8">
              <span>{label}</span>
              <ChevronDown className="size-4 text-ink-gray-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  icon={() => <ChevronLeft className="size-4" />}
                  label="Previous range"
                  onClick={onPrev}
                />
                <Button variant="outline" onClick={onToday}>
                  Today
                </Button>
                <Button
                  variant="ghost"
                  icon={() => <ChevronRight className="size-4" />}
                  label="Next range"
                  onClick={onNext}
                />
              </div>
              {filterSlot}
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden">
        <div className="grid" style={columnStyle}>
          {visibleDays.map((day) => (
            <div
              key={`weekday-${day.toISOString()}`}
              className="py-2 text-center text-base text-ink-gray-6"
            >
              {format(day, "EEE")}
            </div>
          ))}
        </div>

        <div
          className="grid border-t border-outline-gray-1"
          style={columnStyle}
        >
          {visibleDays.map((day) => {
            const isWeekend = WEEKEND_DAY_INDICES.includes(day.getDay());
            const isToday = Boolean(today && isSameDay(day, today));
            const dayEvents = eventsByDay.get(format(day, "yyyy-MM-dd")) ?? [];

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex min-h-[140px] flex-col gap-0.5 border-b border-l first:border-l-0 border-outline-gray-1 py-px pl-0.5 pr-px",
                  isWeekend ? "bg-surface-gray-1" : "bg-surface-white",
                )}
              >
                <div className="flex justify-end p-0.5">
                  <span
                    className={cn(
                      "flex h-7 min-w-7 items-center justify-center px-1 text-base",
                      isToday
                        ? "rounded-lg bg-surface-red-5 text-ink-red-1"
                        : "text-ink-gray-6",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                {dayEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    title={event.title}
                    subtitle={event.subtitle}
                    color={event.color}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarTimeline;
