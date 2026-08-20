/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { TeamMember } from "@/components/timesheet-row/teamTimesheetRow";
import { hashString, parseFrappeErrorMsg } from "@/lib/utils";
import { TEAM_MEMBER_PAGE_LENGTH } from "./constants";
import type {
  TeamFilterArgs,
  TeamMemberPayload,
  TeamMembersResponse,
} from "./types";

type UseTeamWeekMembersOptions = {
  startDate: string;
  filterArgs: TeamFilterArgs;
  enabled: boolean;
};

type UseTeamWeekMembersResult = {
  members: TeamMember[];
  hasMore: boolean;
  isLoadingMembers: boolean;
  isNextPageLoading: boolean;
  loadMore: () => void;
  refreshMember: (member: TeamMemberPayload) => void;
};

const QUERY_SIGNATURE_PREFIX = "team-week-members:";

const toTeamMember = (member: TeamMemberPayload): TeamMember => ({
  label: member.employee_name,
  employee: member.employee,
  avatarUrl: member.image ?? undefined,
  tasks: member.tasks,
  leaves: member.leaves,
  holidays: member.holidays,
  workingHour: member.working_hour,
  workingFrequency: member.working_frequency,
  status: member.status,
  backdateRestrictedBefore: member.backdate_restricted_before,
});

export function useTeamWeekMembers({
  startDate,
  filterArgs,
  enabled,
}: UseTeamWeekMembersOptions): UseTeamWeekMembersResult {
  const toast = useToasts();

  const querySignature = useMemo(
    () =>
      `${QUERY_SIGNATURE_PREFIX}${hashString(
        JSON.stringify({ startDate, ...filterArgs }),
      )}`,
    [startDate, filterArgs],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: TeamMembersResponse | null,
    ): PaginationKey | null => {
      if (!enabled) {
        return null;
      }
      if (previousPageData?.message && !previousPageData.message.has_more) {
        return null;
      }
      return [querySignature, pageIndex] as const;
    },
    [enabled, querySignature],
  );

  const {
    data: paginatedData,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = usePagination<TeamMembersResponse>(
    "next_pms.timesheet.api.team.get_team_timesheet_data",
    getKey,
    {
      start_date: startDate,
      page_length: TEAM_MEMBER_PAGE_LENGTH,
      ...filterArgs,
    },
    {
      revalidateOnFocus: false,
      revalidateAll: false,
      revalidateFirstPage: false,
      keepPreviousData: true,
      persistSize: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      onError: (err) => {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      },
    },
  );

  const pages = useMemo(() => paginatedData ?? [], [paginatedData]);

  const members = useMemo(
    () =>
      pages.flatMap((page) => (page.message?.members ?? []).map(toTeamMember)),
    [pages],
  );

  const lastPayload = pages.at(-1)?.message;
  const hasMore = lastPayload ? Boolean(lastPayload.has_more) : false;
  const isLoadingMembers = enabled && isLoading;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";

  const loadMore = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMore) {
      return;
    }
    void setSize((current) => current + 1);
  }, [hasMore, isLoading, isNextPageLoading, setSize]);

  const refreshMember = useCallback(
    (member: TeamMemberPayload) => {
      if (!paginatedData?.length) {
        return;
      }

      let changed = false;
      const nextPages = paginatedData.map((page) => {
        const currentMembers = page.message?.members;
        if (!currentMembers?.some((m) => m.employee === member.employee)) {
          return page;
        }
        changed = true;
        return {
          ...page,
          message: {
            ...page.message!,
            members: currentMembers.map((m) =>
              m.employee === member.employee ? member : m,
            ),
          },
        };
      });

      if (changed) {
        void mutate(nextPages, { revalidate: false });
      }
    },
    [mutate, paginatedData],
  );

  return {
    members,
    hasMore,
    isLoadingMembers,
    isNextPageLoading,
    loadMore,
    refreshMember,
  };
}
