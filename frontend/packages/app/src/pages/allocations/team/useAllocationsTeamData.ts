/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
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
};

type UseAllocationsTeamDataResult = {
  members: Member[];
  isLoading: boolean;
  error: FrappeError | undefined;
  refresh: () => Promise<void>;
};

export function useAllocationsTeamData({
  anchorDate,
  weekCount,
  search,
}: UseAllocationsTeamDataOptions): UseAllocationsTeamDataResult {
  const { call: fetchTeamViewData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FrappeError>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetchTeamViewData({
        date: format(anchorDate, "yyyy-MM-dd"),
        max_week: weekCount,
        employee_name: search || null,
        start: 0,
        page_length: 100,
        need_hours_summary: false,
      });

      const payload = response.message as TeamAllocationResponse;
      setMembers(mapTeamAllocationToMembers(payload));
    } catch (err) {
      setError(err as FrappeError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTeamViewData, anchorDate, weekCount, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    members,
    isLoading,
    error,
    refresh,
  };
}
