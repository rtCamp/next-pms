/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * External dependencies.
 */
import { useContext } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";

export type PaginationKey = readonly [cacheKey: string, pageIndex: number];
type PaginationParams = Record<string, unknown> & {
  page_length: number;
};

/**
 *  Hook to make a GET request to the server with useSWRInfinite support.
 *
 * @param method - name of the method to call (will be dotted path e.g. "frappe.client.get_list")
 * @param getKey - A function that accepts the index and previous page data, and returns the key for that page
 * @param params - Request params for every page. Must include `page_length` so the hook can derive the `start` offset.
 * @param options - Optional useSWRInfinite configuration
 *
 * @typeParam T - Type of the data returned by the method
 * @typeParam P - Type of the request params. Must extend `PaginationParams`.
 * @returns The `useSWRInfinite` response for the paginated request. `data` is an array of page responses.
 */
export const usePagination = <
  T = any,
  P extends PaginationParams = PaginationParams,
>(
  method: string,
  getKey: (index: number, previousPageData: T | null) => PaginationKey | null,
  params: P,
  options?: SWRInfiniteConfiguration,
): SWRInfiniteResponse<T, Error> => {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const swrResult = useSWRInfinite<T, Error>(
    getKey,
    ([, pageIndex]: PaginationKey) => {
      return call.get<T>(method, {
        ...params,
        start: pageIndex * params.page_length,
      });
    },
    {
      ...options,
    },
  );

  return {
    ...swrResult,
  };
};
