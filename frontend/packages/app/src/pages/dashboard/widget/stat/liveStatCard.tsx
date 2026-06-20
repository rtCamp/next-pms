/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { StatCard } from "../statCard";
import { StatCardSkeleton } from "./statCardSkeleton";
import type { StatCardConfig, StatMessage } from "./types";

export function LiveStatCard({ config }: { config: StatCardConfig }) {
  const { data, isLoading } = useFrappeGetCall<{ message: StatMessage }>(
    config.endpoint,
    config.params,
  );

  if (isLoading || !data) return <StatCardSkeleton />;

  return (
    <StatCard
      label={config.label}
      subLabel={config.subLabel}
      value={config.format(data.message)}
    />
  );
}
