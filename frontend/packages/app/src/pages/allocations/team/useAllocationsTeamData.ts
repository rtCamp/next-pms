/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Member } from "@next-pms/design-system/components";
import { format } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { TeamAllocationResponse } from "./type";
import { mapTeamAllocationToMembers } from "./utils";

type UseAllocationsTeamDataOptions = {
  anchorDate: Date;
  weekCount: number;
  search: string;
  start: number;
  pageLength: number;
};

type UseAllocationsTeamDataResult = {
  members: Member[];
  hasMore: boolean;
  totalCount: number;
  isLoading: boolean;
  error: FrappeError | undefined;
  refresh: () => Promise<void>;
};

export function useAllocationsTeamData({
  anchorDate,
  weekCount,
  search,
  start,
  pageLength,
}: UseAllocationsTeamDataOptions): UseAllocationsTeamDataResult {
  const { call: fetchTeamViewData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FrappeError>();
  const latestRequestIdRef = useRef(0);

  const refresh = useCallback<
    UseAllocationsTeamDataResult["refresh"]
  >(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(undefined);

    try {
      const loadedMemberCount = Math.max(pageLength, start + pageLength);

      const response = await fetchTeamViewData({
        date: format(anchorDate, "yyyy-MM-dd"),
        max_week: weekCount,
        employee_name: search || null,
        start: 0,
        page_length: loadedMemberCount,
        need_hours_summary: false,
      });

      if (requestId === latestRequestIdRef.current) {
        const payload = (response?.message ?? {}) as TeamAllocationResponse;
        setMembers(mapTeamAllocationToMembers(payload));
        setHasMore(Boolean(payload.has_more));
        setTotalCount(payload.total_count ?? 0);
      }
    } catch (err) {
      if (requestId === latestRequestIdRef.current) {
        setError(err as FrappeError);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchTeamViewData, anchorDate, weekCount, search, start, pageLength]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    members,
    hasMore,
    totalCount,
    isLoading,
    error,
    refresh,
  };
}
