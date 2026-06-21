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
import { Combobox } from "@rtcamp/frappe-ui-react";
import { addDays, format } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { CalendarTimelineCardSkeleton } from "./skeleton";
import { ALL_PROJECTS_VALUE, MOCK_PROJECT_OPTIONS } from "../../constants";
import type { CalendarTimelineResponse } from "../../types";

const TYPE_COLOR: Record<string, CalendarEventColor> = {
  Milestone: "violet",
  Touchpoint: "blue",
};

export default function CalendarTimelineCard() {
  const [rangeStart, setRangeStart] = useState<Date>(() =>
    getWeekStart(new Date()),
  );
  const [project, setProject] = useState<string>(ALL_PROJECTS_VALUE);

  const { data, isLoading } = useFrappeGetCall<CalendarTimelineResponse>(
    "next_pms.api.dashboard.get_calendar_timeline_items",
    {
      from_date: format(rangeStart, "yyyy-MM-dd"),
      to_date: format(addDays(rangeStart, DEFAULT_VISIBLE_DAYS), "yyyy-MM-dd"),
      project: project === ALL_PROJECTS_VALUE ? undefined : project,
    },
  );

  const events = useMemo<CalendarTimelineEvent[]>(
    () =>
      (data?.message.data ?? []).map((item) => ({
        id: item.name,
        title: item.title,
        subtitle: item.project,
        date: item.start_date.slice(0, 10),
        color: TYPE_COLOR[item.type] ?? "blue",
      })),
    [data],
  );

  if (isLoading || !data) return <CalendarTimelineCardSkeleton />;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards">
      <CalendarTimeline
        events={events}
        rangeStart={rangeStart}
        today={new Date()}
        filterSlot={
          <Combobox
            className="w-fit rounded-lg border-outline-gray-1 bg-white px-2 py-1.5 text-sm text-ink-gray-7"
            inputClassName="bg-white"
            options={MOCK_PROJECT_OPTIONS}
            value={project}
            onChange={(value) => setProject(value ?? ALL_PROJECTS_VALUE)}
          />
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
