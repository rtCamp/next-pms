/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useUserDetails } from "@/hooks/useUserDetails";
import { useProjectDetail } from "@/pages/project-details/context";
import type { UserDetails } from "@/pages/project-details/types";
import { GROWTH_DOCTYPE } from "./constants";
import type {
  ApiGrowthInitiativeItem,
  GrowthFilters,
  GrowthInitiativeItem,
  GrowthSort,
  UserDetailsMap,
} from "./types";

const toUserMap = (emails: string[], users: UserDetails[]): UserDetailsMap =>
  Object.fromEntries(
    emails.map((email) => [email, users.find((u) => u.name === email)]),
  );

export function useGrowthData(filters: GrowthFilters, sort: GrowthSort | null) {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: [string, string, string][] = [["project", "=", projectId]];
    if (filters.activityOwner)
      base.push(["activity_owner", "=", filters.activityOwner]);
    if (filters.ideationOwner)
      base.push(["ideation_owner", "=", filters.ideationOwner]);
    if (filters.status) base.push(["status", "=", filters.status]);
    if (filters.category) base.push(["category", "=", filters.category]);
    return base;
  }, [projectId, filters]);

  const {
    data,
    isLoading,
    error,
    mutate: mutateList,
  } = useFrappeGetDocList<ApiGrowthInitiativeItem>(
    GROWTH_DOCTYPE,
    {
      fields: [
        "name",
        "project",
        "activity",
        "category",
        "client_priority",
        "status",
        "is_closed",
        "closed_status",
        "activity_owner",
        "ideation_owner",
        "modified",
      ],
      filters: frappeFilters,
      orderBy: sort ?? { field: "modified", order: "desc" },
      limit: 500,
    },
    undefined,
    { keepPreviousData: true },
  );

  const { data: ownersData, mutate: mutateOwners } = useFrappeGetDocList<
    Pick<ApiGrowthInitiativeItem, "activity_owner" | "ideation_owner">
  >(GROWTH_DOCTYPE, {
    fields: ["activity_owner", "ideation_owner"],
    filters: [["project", "=", projectId]],
    limit: 500,
  });

  const activityOwners = useMemo(
    () =>
      [...new Set((ownersData ?? []).map((r) => r.activity_owner))].filter(
        Boolean,
      ) as string[],
    [ownersData],
  );
  const ideationOwners = useMemo(
    () =>
      [...new Set((ownersData ?? []).map((r) => r.ideation_owner))].filter(
        Boolean,
      ) as string[],
    [ownersData],
  );
  const allEmails = useMemo(
    () => [...new Set([...activityOwners, ...ideationOwners])],
    [activityOwners, ideationOwners],
  );

  const { data: usersData } = useUserDetails(allEmails);

  const activityOwnersWithDetails = useMemo(
    () => toUserMap(activityOwners, usersData ?? []),
    [activityOwners, usersData],
  );
  const ideationOwnersWithDetails = useMemo(
    () => toUserMap(ideationOwners, usersData ?? []),
    [ideationOwners, usersData],
  );

  const mutate = useCallback(
    () => Promise.all([mutateList(), mutateOwners()]),
    [mutateList, mutateOwners],
  );

  const enrichedData = useMemo<GrowthInitiativeItem[]>(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        owner_details: item.activity_owner
          ? activityOwnersWithDetails[item.activity_owner]
          : null,
      })),
    [data, activityOwnersWithDetails],
  );

  return {
    data: enrichedData,
    isLoading,
    error,
    mutate,
    activityOwnersWithDetails,
    ideationOwnersWithDetails,
  };
}
