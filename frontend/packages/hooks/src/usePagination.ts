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
 * @param getKey - A function that accepts the index and the previous page data, returns the key of a page
 * @param options [Optional] SWRConfiguration options for fetching data
 *
 * @typeParam T - Type of the data returned by the method
 * @returns an object (SWRResponse) with the following properties: data (number), error, isValidating, and mutate
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
