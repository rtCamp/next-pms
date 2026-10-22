/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useUserDetails } from "@/hooks/useUserDetails";
import { PIPELINE_METHOD } from "./constants";
import type {
  PipelineClient,
  PipelineFilters,
  PipelineInitiative,
  PipelineResponse,
  UsersByEmail,
} from "./types";

const NO_INITIATIVES: PipelineInitiative[] = [];
const NO_CLIENTS: Record<string, PipelineClient> = {};

export function usePipelineData(filters: PipelineFilters, currency: string) {
  const params = useMemo(
    () => ({
      currency,
      search: filters.search || undefined,
      customer: filters.customer || undefined,
      activity_owner: filters.activityOwner || undefined,
      project_manager: filters.projectManager || undefined,
      category: filters.category || undefined,
      client_priority: filters.clientPriority || undefined,
      status: filters.status || undefined,
    }),
    [filters, currency],
  );

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: PipelineResponse;
  }>(PIPELINE_METHOD, params, undefined, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const initiatives = data?.message.initiatives ?? NO_INITIATIVES;
  const emails = useMemo(
    () =>
      initiatives.flatMap(
        (item) =>
          [item.activity_owner, item.project_manager].filter(
            Boolean,
          ) as string[],
      ),
    [initiatives],
  );
  const { data: userDetails } = useUserDetails(emails);
  const users = useMemo<UsersByEmail>(
    () => Object.fromEntries((userDetails ?? []).map((u) => [u.name, u])),
    [userDetails],
  );

  return {
    initiatives,
    clients: data?.message.clients ?? NO_CLIENTS,
    users,
    isLoading,
    error,
    mutate,
  };
}
