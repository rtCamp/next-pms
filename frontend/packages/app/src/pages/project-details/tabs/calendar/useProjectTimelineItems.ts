/**
 * External dependencies.
 */
import { endOfISOWeek, endOfMonth, format, startOfISOWeek } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { ApiTimelineItemsResponse } from "./types";
import { mapTimelineItem } from "./utils";

// Generous upper limit - avoids multiple round-trips for a single month
const ITEMS_LIMIT = 200;

export function useProjectTimelineItems(
  projectId: string,
  year: number,
  month: number,
) {
  // Fetch window: ISO week containing the 1st → ISO week containing the last day of the month
  const viewStart = startOfISOWeek(new Date(year, month, 1));
  const viewEnd = endOfISOWeek(endOfMonth(new Date(year, month, 1)));
  const startDate = format(viewStart, "yyyy-MM-dd");
  const endDate = format(viewEnd, "yyyy-MM-dd");

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: ApiTimelineItemsResponse;
  }>(
    "next_pms.next_projects.api.project_timeline_item.get_project_timeline_items",
    {
      project: projectId,
      start_date: startDate,
      end_date: endDate,
      limit: ITEMS_LIMIT,
      start: 0,
    },
    // Disable when no project is provided
    projectId ? undefined : null,
    {
      revalidateOnFocus: false,
    },
  );

  const allItems = (data?.message?.data ?? [])
    .filter(
      (item) => item.start_date !== null && item.planned_end_date !== null,
    )
    .map(mapTimelineItem);

  return { items: allItems, isLoading, error, mutate };
}
