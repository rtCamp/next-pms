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
  normalizeLikeFilterValue,
} from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { RiskFilters, RiskItem, RiskSort, UserDetails } from "./types";

export function useRisksData(filters: RiskFilters, sort: RiskSort | null) {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [["project", "=", projectId]];

    if (filters.owner) base.push(["owner", "=", filters.owner]);
    if (filters.riskOwner) base.push(["risk_owner", "=", filters.riskOwner]);
    if (filters.status) base.push(["status", "=", filters.status]);
    if (filters.riskLevel) base.push(["risk_level", "=", filters.riskLevel]);

    filters.advanced.forEach((f) => {
      if (!isCompleteFilterCondition(f)) return;
      base.push([
        f.field,
        f.operator,
        isNoValueOperator(f.operator)
          ? null
          : normalizeLikeFilterValue(f.operator, f.value),
      ]);
    });

    return base;
  }, [
    projectId,
    filters.owner,
    filters.riskOwner,
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
        "risk_owner",
      ],
      filters: frappeFilters as never,
      orderBy,
      limit: 500,
    },
    undefined,
    {
      keepPreviousData: true,
    },
  );

  const { data: allOwnersData } = useFrappeGetDocList<{
    owner: string;
    risk_owner: string | null;
  }>("Risk", {
    fields: ["owner", "risk_owner"],
    filters: [["project", "=", projectId]] as never,
    limit: 500,
  });

  const allOwners = useMemo(() => {
    if (!allOwnersData?.length) return [];
    return [
      ...new Set(allOwnersData.map((r) => r.owner).filter(Boolean) as string[]),
    ];
  }, [allOwnersData]);

  const allRiskOwners = useMemo(() => {
    if (!allOwnersData?.length) return [];
    return [
      ...new Set(
        allOwnersData.map((r) => r.risk_owner).filter(Boolean) as string[],
      ),
    ];
  }, [allOwnersData]);

  const allUserEmails = useMemo(
    () => [...new Set([...allOwners, ...allRiskOwners])],
    [allOwners, allRiskOwners],
  );

  // Build a stable SWR key so the user list re-fetches only when the set of owners changes.
  // Pass null when there are no owners to skip the request entirely.
  const usersSwrKey = useMemo(() => {
    if (!allUserEmails.length) return null;
    return `risks-users-${hashString(allUserEmails.slice().sort().join(","))}`;
  }, [allUserEmails]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: allUserEmails.length ? [["name", "in", allUserEmails]] : [],
      limit: allUserEmails.length || 1,
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
      risk_owner_details: risk.risk_owner ? userMap[risk.risk_owner] : null,
    }));
  }, [data, userMap]);

  const allOwnersWithDetails = useMemo(
    () =>
      Object.fromEntries(
        allOwners.map((email) => [email, userMap[email]]),
      ) as Record<string, UserDetails | undefined>,
    [allOwners, userMap],
  );

  const allRiskOwnersWithDetails = useMemo(
    () =>
      Object.fromEntries(
        allRiskOwners.map((email) => [email, userMap[email]]),
      ) as Record<string, UserDetails | undefined>,
    [allRiskOwners, userMap],
  );

  return {
    data: enrichedData,
    isLoading,
    error,
    mutate,
    allOwnersWithDetails,
    allRiskOwnersWithDetails,
  };
}
