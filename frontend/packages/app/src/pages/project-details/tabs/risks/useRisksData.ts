/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { RiskItem, UserDetails } from "./types";

export function useRisksData() {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [["project", "=", projectId]];
    // TODO: Add more filters
    return base;
  }, [projectId]);

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
      limit: 500,
    },
  );

  const ownerEmails = useMemo(() => {
    if (!data?.length) return [];
    const emails = data.map((r) => r.owner).filter(Boolean) as string[];
    return [...new Set(emails)];
  }, [data]);

  // Build a stable SWR key so the user list re-fetches only when the set of owners changes.
  // Pass null when there are no owners to skip the request entirely.
  const usersSwrKey =
    ownerEmails.length > 0
      ? `risks-users-${ownerEmails.slice().sort().join(",")}`
      : null;

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "user_image"],
      filters: ownerEmails.length
        ? ([["name", "in", ownerEmails]] as never)
        : ([] as never),
      limit: ownerEmails.length || 1,
    },
    usersSwrKey,
  );

  const enrichedData = useMemo(() => {
    if (!data?.length) return [];
    const imageMap = Object.fromEntries(
      (usersData ?? []).map((u) => [u.name, u.user_image]),
    );
    return data.map((risk) => ({
      ...risk,
      user_image: risk.owner ? (imageMap[risk.owner] ?? null) : null,
    }));
  }, [data, usersData]);

  return { data: enrichedData, isLoading, error, mutate };
}
