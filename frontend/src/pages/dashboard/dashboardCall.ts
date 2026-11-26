import { useCall } from "frappe-ui";

/**
 * A GET call to `next_pms.api.dashboard.<method>`, loaded on mount and again whenever
 * the params returned by `params` change.
 */
export function useDashboardCall<TResponse>(
  method: string,
  params?: () => Record<string, string | number>,
) {
  return useCall<TResponse, Record<string, string | number>>({
    url: `/api/v2/method/next_pms.api.dashboard.${method}`,
    params,
    refetch: Boolean(params),
  });
}
