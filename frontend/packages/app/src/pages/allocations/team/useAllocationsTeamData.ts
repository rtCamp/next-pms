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
import {
  appendMembers,
  mapTeamAllocationToMembers,
  replaceMembers,
} from "./utils";

type UseAllocationsTeamDataOptions = {
  anchorDate: Date;
  weekCount: number;
  search: string;
  pageLength: number;
};

type UseAllocationsTeamDataResult = {
  members: Member[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refresh: (employeeIds?: string[]) => Promise<void>;
};

type AllocationsTeamDataState = {
  members: Member[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadedCount: number;
};

export function useAllocationsTeamData({
  anchorDate,
  weekCount,
  search,
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
    isLoadingMore: false,
    loadedCount: 0,
  });
  const latestRequestIdRef = useRef(0);
  const fetchTeamViewDataRef = useRef(fetchTeamViewData);
  const toastRef = useRef(toast);

  useEffect(() => {
    fetchTeamViewDataRef.current = fetchTeamViewData;
  }, [fetchTeamViewData]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const fetchMembers = useCallback(
    async ({
      requestStart,
      requestPageLength,
      employeeIds,
    }: {
      requestStart: number;
      requestPageLength: number;
      employeeIds?: string[];
    }) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      const requestDate = format(anchorDate, "yyyy-MM-dd");
      const isTargetedRefresh = Boolean(employeeIds?.length);
      const isLoadMoreRequest = !isTargetedRefresh && requestStart > 0;

      setData((current) => ({
        ...current,
        isLoading: true,
        isLoadingMore: isLoadMoreRequest,
      }));

      try {
        const response = await fetchTeamViewDataRef.current({
          date: requestDate,
          max_week: weekCount,
          employee_name: search || null,
          start: requestStart,
          page_length: requestPageLength,
          need_hours_summary: false,
          ...(employeeIds?.length
            ? { employee_id: JSON.stringify(employeeIds) }
            : {}),
        });

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        const payload = (response?.message ?? {}) as TeamAllocationResponse;
        const incomingMembers = mapTeamAllocationToMembers(payload);

        setData((current) => ({
          members: isTargetedRefresh
            ? replaceMembers(current.members, incomingMembers)
            : requestStart > 0
              ? appendMembers(current.members, incomingMembers)
              : incomingMembers,
          hasMore: isTargetedRefresh
            ? current.hasMore
            : Boolean(payload.has_more),
          isLoading: false,
          isLoadingMore: false,
          loadedCount: isTargetedRefresh
            ? current.loadedCount
            : requestStart > 0
              ? current.loadedCount + incomingMembers.length
              : incomingMembers.length,
        }));
      } catch (err) {
        if (requestId === latestRequestIdRef.current) {
          setData((current) => ({
            ...current,
            isLoading: false,
            isLoadingMore: false,
          }));
          toastRef.current.error(parseFrappeErrorMsg(err as FrappeError));
        }
      }
    },
    [anchorDate, weekCount, search],
  );

  const refresh = useCallback<UseAllocationsTeamDataResult["refresh"]>(
    async (employeeIds) => {
      const targetEmployeeIds = [...new Set(employeeIds ?? [])].filter(
        (employeeId): employeeId is string => Boolean(employeeId),
      );

      if (targetEmployeeIds.length > 0) {
        await fetchMembers({
          requestStart: 0,
          requestPageLength: targetEmployeeIds.length,
          employeeIds: targetEmployeeIds,
        });
        return;
      }

      await fetchMembers({
        requestStart: 0,
        requestPageLength: Math.max(pageLength, data.loadedCount),
      });
    },
    [data.loadedCount, fetchMembers, pageLength],
  );

  const loadMore = useCallback(() => {
    if (data.isLoading || !data.hasMore) {
      return;
    }

    void fetchMembers({
      requestStart: data.loadedCount,
      requestPageLength: pageLength,
    });
  }, [
    data.hasMore,
    data.isLoading,
    data.loadedCount,
    fetchMembers,
    pageLength,
  ]);

  useEffect(() => {
    void fetchMembers({
      requestStart: 0,
      requestPageLength: pageLength,
    });
  }, [anchorDate, fetchMembers, pageLength, search, weekCount]);

  return {
    members: data.members,
    hasMore: data.hasMore,
    isLoading: data.isLoading,
    isLoadingMore: data.isLoadingMore,
    loadMore,
    refresh,
  };
}
