/**
 * External dependencies.
 */
import { useMemo } from "react";
import {
  differenceInDays,
  endOfISOWeek,
  endOfMonth,
  format,
  startOfISOWeek,
} from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem, UserRef } from "./types";

// Generous upper limit - avoids multiple round-trips for a single month
const ITEMS_LIMIT = 200;

interface ApiUserRef {
  user: string;
  full_name: string;
  image: string | null;
}

interface ApiTimelineItem {
  name: string;
  title: string;
  project: string;
  type: "Milestone" | "Touchpoint";
  is_complete: 0 | 1;
  start_date: string | null;
  planned_end_date: string | null;
  actual_end_date: string | null;
  owner: ApiUserRef | null;
  watchers: ApiUserRef[];
}

interface ApiResponse {
  data: ApiTimelineItem[];
  total_count: number;
  has_more: boolean;
}

function mapUserRef(raw: ApiUserRef): UserRef {
  return {
    name: raw.user,
    fullName: raw.full_name,
    avatar: raw.image ?? undefined,
  };
}

function mapItem(raw: ApiTimelineItem): ProjectTimelineItem {
  return {
    id: raw.name,
    title: raw.title,
    project: raw.project,
    type: raw.type,
    isComplete: Boolean(raw.is_complete),
    startDate: raw.start_date ?? undefined,
    plannedEndDate: raw.planned_end_date ?? undefined,
    actualEndDate: raw.actual_end_date ?? undefined,
    owner: raw.owner ? mapUserRef(raw.owner) : { name: "", fullName: "" },
    watchers: (raw.watchers ?? []).map(mapUserRef),
  };
}

export function useProjectTimelineItems(
  projectId: string,
  year: number,
  month: number,
) {
  // Fetch window: ISO week containing the 1st → ISO week containing the last day of the month
  const viewStart = startOfISOWeek(new Date(year, month, 1));
  const viewEnd = endOfISOWeek(endOfMonth(new Date(year, month, 1)));
  const weeksCount = Math.round((differenceInDays(viewEnd, viewStart) + 1) / 7);
  const startDate = format(viewStart, "yyyy-MM-dd");
  const endDate = format(viewEnd, "yyyy-MM-dd");

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: ApiResponse;
  }>(
    "next_pms.next_projects.api.project_timeline_item.get_project_timeline_items",
    {
      project: projectId,
      start_date: startDate,
      max_week: weeksCount,
      limit: ITEMS_LIMIT,
      start: 0,
    },
    // Disable when no project is provided
    projectId ? undefined : null,
    {
      revalidateOnFocus: false,
    },
  );

  const { items, monthItems } = useMemo(() => {
    const allItems = (data?.message?.data ?? [])
      .filter((item) =>
        item.type === "Milestone"
          ? item.start_date !== null
          : item.planned_end_date !== null,
      )
      .map(mapItem);

    // Milestones are positioned by start_date; touchpoints by planned_end_date.
    const viewItems = allItems.filter((item) =>
      item.type === "Milestone"
        ? item.startDate !== undefined &&
          item.startDate >= startDate &&
          item.startDate <= endDate
        : item.plannedEndDate !== undefined &&
          item.plannedEndDate >= startDate &&
          item.plannedEndDate <= endDate,
    );

    return { items: viewItems, monthItems: viewItems };
  }, [data, startDate, endDate]);

  return { items, monthItems, isLoading, error, mutate };
}
