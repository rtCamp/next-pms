/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { GROWTH_DOCTYPE } from "./constants";
import type { ApiGrowthInitiativeItem, GrowthInitiativeItem } from "./types";
import type { UserDetails } from "../risks/types";

export function useGrowthData() {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error, mutate } =
    useFrappeGetDocList<ApiGrowthInitiativeItem>(
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
          "modified",
        ],
        filters: [["project", "=", projectId]],
        orderBy: { field: "modified", order: "desc" },
        limit: 500,
      },
      undefined,
      { keepPreviousData: true },
    );

  const ownerEmails = useMemo(
    () =>
      [
        ...new Set(
          (data ?? []).map((item) => item.activity_owner).filter(Boolean),
        ),
      ] as string[],
    [data],
  );

  const usersSwrKey = useMemo(() => {
    if (!ownerEmails.length) return null;
    return `growth-users-${hashString(ownerEmails.slice().sort().join(","))}`;
  }, [ownerEmails]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: ownerEmails.length ? [["name", "in", ownerEmails]] : [],
      limit: ownerEmails.length || 1,
    },
    usersSwrKey,
  );

  const enrichedData = useMemo<GrowthInitiativeItem[]>(() => {
    if (!data?.length) return [];
    const userMap = Object.fromEntries(
      (usersData ?? []).map((u) => [u.name, u]),
    );
    return data.map((item) => ({
      ...item,
      owner_details: item.activity_owner ? userMap[item.activity_owner] : null,
    }));
  }, [data, usersData]);

  return { data: enrichedData, isLoading, error, mutate };
}
