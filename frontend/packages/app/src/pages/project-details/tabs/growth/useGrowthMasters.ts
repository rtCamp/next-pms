/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { GROWTH_CATEGORY_DOCTYPE, GROWTH_STATUS_DOCTYPE } from "./constants";
import type { GrowthStatusDoc, NamedDoc } from "./types";

export function useGrowthMasters() {
  const { data: allStatuses, isLoading: statusesLoading } =
    useFrappeGetDocList<GrowthStatusDoc>(GROWTH_STATUS_DOCTYPE, {
      fields: ["name", "status_type", "is_closed", "creation"],
      orderBy: { field: "name", order: "asc" },
    });
  const statuses = useMemo(
    () => (allStatuses ?? []).filter((s) => s.status_type === "Status"),
    [allStatuses],
  );
  const closedStatuses = useMemo(
    () => (allStatuses ?? []).filter((s) => s.status_type === "Closed Status"),
    [allStatuses],
  );
  const { data: categories, isLoading: categoriesLoading } =
    useFrappeGetDocList<NamedDoc>(GROWTH_CATEGORY_DOCTYPE, {
      fields: ["name"],
      orderBy: { field: "name", order: "asc" },
    });

  return useMemo(
    () => ({
      statuses,
      closedStatuses,
      categories: categories ?? [],
      isMastersLoading: statusesLoading || categoriesLoading,
    }),
    [statuses, closedStatuses, categories, statusesLoading, categoriesLoading],
  );
}
