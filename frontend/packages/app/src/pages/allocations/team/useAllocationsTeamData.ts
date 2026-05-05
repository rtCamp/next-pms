/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Member } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
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
  isLoading: boolean;
  refresh: () => Promise<void>;
};

type AllocationsTeamDataState = Omit<UseAllocationsTeamDataResult, "refresh">;

export function useAllocationsTeamData({
  anchorDate,
  weekCount,
  search,
  start,
  pageLength,
}: UseAllocationsTeamDataOptions): UseAllocationsTeamDataResult {
  const toast = useToasts();
  const { call: fetchTeamViewData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
  );

  const [data, setData] = useState<AllocationsTeamDataState>({
    members: [],
    hasMore: true,
    isLoading: false,
  });
  const latestRequestIdRef = useRef(0);

  const refresh = useCallback<
    UseAllocationsTeamDataResult["refresh"]
  >(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    setData((current) => ({
      ...current,
      isLoading: true,
    }));

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
        setData({
          members: mapTeamAllocationToMembers(payload),
          hasMore: Boolean(payload.has_more),
          isLoading: false,
        });
      }
    } catch (err) {
      if (requestId === latestRequestIdRef.current) {
        setData((current) => ({
          ...current,
          isLoading: false,
        }));
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    }
  }, [
    fetchTeamViewData,
    anchorDate,
    weekCount,
    search,
    start,
    pageLength,
    toast,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...data,
    refresh,
  };
}
