/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import {
  CalendarTimeline,
  DEFAULT_VISIBLE_DAYS,
  getWeekStart,
} from "@next-pms/design-system/components";
import type {
  CalendarEventColor,
  CalendarTimelineEvent,
} from "@next-pms/design-system/components";
import { Button, DatePicker, MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import {
  SmallDown,
  SmallLeftChevron,
  SmallRightChevron,
} from "@rtcamp/frappe-ui-react/icons";
import { addDays, format, parseISO } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { CalendarTimelineCardSkeleton } from "./skeleton";
import type { CalendarTimelineResponse } from "../../types";

const TYPE_COLOR: Record<string, CalendarEventColor> = {
  Milestone: "violet",
  Touchpoint: "blue",
};

export default function CalendarTimelineCard() {
  const [rangeStart, setRangeStart] = useState<Date>(() =>
    getWeekStart(new Date()),
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const { data, isLoading } = useFrappeGetCall<CalendarTimelineResponse>(
    "next_pms.api.dashboard.get_calendar_timeline_items",
    {
      from_date: format(rangeStart, "yyyy-MM-dd"),
      to_date: format(addDays(rangeStart, DEFAULT_VISIBLE_DAYS), "yyyy-MM-dd"),
    },
  );

  const projectOptions = useMemo<MultiSelectOption[]>(() => {
    const byName = new Map<string, string>();
    for (const item of data?.message.data ?? []) {
      byName.set(item.project, item.project_name ?? item.project);
    }
    return Array.from(byName, ([value, label]) => ({ value, label }));
  }, [data]);

  const events = useMemo<CalendarTimelineEvent[]>(
    () =>
      (data?.message.data ?? [])
        .filter(
          (item) =>
            selectedProjects.length === 0 ||
            selectedProjects.includes(item.project),
        )
        .map((item) => ({
          id: item.name,
          title: item.title,
          subtitle: item.project_name ?? item.project,
          date: item.start_date.slice(0, 10),
          color: TYPE_COLOR[item.type] ?? "blue",
        })),
    [data, selectedProjects],
  );

  if (isLoading || !data) return <CalendarTimelineCardSkeleton />;

  const allProjectsSelected =
    selectedProjects.length === 0 ||
    selectedProjects.length === projectOptions.length;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards">
      <CalendarTimeline
        events={events}
        rangeStart={rangeStart}
        today={new Date()}
        headerSlot={
          <>
            <DatePicker
              value={format(rangeStart, "yyyy-MM-dd")}
              placement="bottom-start"
              clearable={false}
              onChange={(val) => {
                const picked = Array.isArray(val) ? val[0] : val;
                if (picked) setRangeStart(getWeekStart(parseISO(picked)));
              }}
            >
              {() => (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex shrink-0 items-center gap-2"
                  iconRight={() => (
                    <SmallDown className="size-4 shrink-0 text-ink-gray-5" />
                  )}
                >
                  <span className="whitespace-nowrap text-lg font-semibold text-ink-gray-8">
                    {`${format(rangeStart, "MMM d")} – ${format(
                      addDays(rangeStart, DEFAULT_VISIBLE_DAYS - 1),
                      "MMM d, yyyy",
                    )}`}
                  </span>
                </Button>
              )}
            </DatePicker>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  icon={() => <SmallLeftChevron className="size-4" />}
                  label="Previous range"
                  onClick={() =>
                    setRangeStart((prev) =>
                      addDays(prev, -DEFAULT_VISIBLE_DAYS),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() => setRangeStart(getWeekStart(new Date()))}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  icon={() => <SmallRightChevron className="size-4" />}
                  label="Next range"
                  onClick={() =>
                    setRangeStart((prev) => addDays(prev, DEFAULT_VISIBLE_DAYS))
                  }
                />
              </div>
              <div className="w-44 shrink-0">
                <MultiSelect
                  popupClassName="scrollbar-thin"
                  options={projectOptions}
                  value={selectedProjects}
                  triggerLabel={
                    allProjectsSelected
                      ? "All projects"
                      : `${selectedProjects.length} project${selectedProjects.length === 1 ? "" : "s"} selected`
                  }
                  onChange={setSelectedProjects}
                />
              </div>
            </div>
          </>
        }
      />
    </div>
  );
}
