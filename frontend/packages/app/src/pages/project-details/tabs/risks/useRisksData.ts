/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  hashString,
  isCompleteFilterCondition,
  isNoValueOperator,
} from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { RiskFilters, RiskItem, RiskSort, UserDetails } from "./types";

export function useRisksData(filters: RiskFilters, sort: RiskSort | null) {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [["project", "=", projectId]];

    if (filters.owner) base.push(["owner", "=", filters.owner]);
    if (filters.status) base.push(["status", "=", filters.status]);
    if (filters.riskLevel) base.push(["risk_level", "=", filters.riskLevel]);

    for (const f of filters.advanced) {
      if (!isCompleteFilterCondition(f)) continue;
      base.push([
        f.field,
        f.operator,
        isNoValueOperator(f.operator) ? null : f.value,
      ]);
    }

    return base;
  }, [
    projectId,
    filters.owner,
    filters.status,
    filters.riskLevel,
    filters.advanced,
  ]);

  const orderBy = useMemo(
    () =>
      sort
        ? { field: sort.field as keyof RiskItem, order: sort.order }
        : { field: "modified" as keyof RiskItem, order: "desc" as const },
    [sort],
  );

  // We are explicitly not including the sort in the key because including it causes data to be cached separately for each sort option, which then when we move an item from one category to another in kanban view and call mutate to refresh the list, it doesn't update the other cached sort options, causing stale data to be shown when user switches sort or view.
  const risksSwrKey = useMemo(
    () => `risks-list-${hashString(JSON.stringify(frappeFilters))}`,
    [frappeFilters],
  );

  const { data, isLoading, error, mutate } = useFrappeGetDocList<RiskItem>(
    "Risk",
    {
      fields: [
        "name",
        "project",
        "risk_category",
        "risk_level",
        "status",
        "summary",
        "owner",
      ],
      filters: frappeFilters as never,
      orderBy,
      limit: 500,
    },
    risksSwrKey,
  );

  const { data: allOwnersData } = useFrappeGetDocList<{ owner: string }>(
    "Risk",
    {
      fields: ["owner"],
      filters: [["project", "=", projectId]] as never,
      limit: 500,
    },
  );

  const allOwners = useMemo(() => {
    if (!allOwnersData?.length) return [];
    const emails = allOwnersData
      .map((r) => r.owner)
      .filter(Boolean) as string[];
    return [...new Set(emails)];
  }, [allOwnersData]);

  // Build a stable SWR key so the user list re-fetches only when the set of owners changes.
  // Pass null when there are no owners to skip the request entirely.
  const usersSwrKey = useMemo(() => {
    if (!allOwners.length) return null;
    return `risks-users-${hashString(allOwners.slice().sort().join(","))}`;
  }, [allOwners]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: allOwners.length ? [["name", "in", allOwners]] : [],
      limit: allOwners.length || 1,
    },
    usersSwrKey,
  );

  const userMap = useMemo(
    () => Object.fromEntries((usersData ?? []).map((u) => [u.name, u])),
    [usersData],
  );

  const enrichedData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((risk) => ({
      ...risk,
      owner_details: userMap[risk.owner],
    }));
  }, [data, userMap]);

  const allOwnersWithDetails = useMemo(
    () =>
      Object.fromEntries(
        allOwners.map((email) => [email, userMap[email]]),
      ) as Record<string, UserDetails | undefined>,
    [allOwners, userMap],
  );

  return { data: enrichedData, isLoading, error, mutate, allOwnersWithDetails };
}
