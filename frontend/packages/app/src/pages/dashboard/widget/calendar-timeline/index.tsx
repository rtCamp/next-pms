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
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { addDays, format } from "date-fns";
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
        filterSlot={
          <div className="w-44 shrink-0">
            <MultiSelect
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
        }
        onPrev={() =>
          setRangeStart((prev) => addDays(prev, -DEFAULT_VISIBLE_DAYS))
        }
        onNext={() =>
          setRangeStart((prev) => addDays(prev, DEFAULT_VISIBLE_DAYS))
        }
        onToday={() => setRangeStart(getWeekStart(new Date()))}
      />
    </div>
  );
}
