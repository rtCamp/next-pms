/**
 * External dependencies.
 */
import { useContext } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { StrictTupleKey } from "swr/_internal";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";

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
export const usePagination = <T = any>(
  method: string,
  getKey: (index: number, previousPageData: T | null) => StrictTupleKey,
  params?: Record<string, any>,
  options?: SWRInfiniteConfiguration
): SWRInfiniteResponse<T, Error> => {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const swrResult = useSWRInfinite<T, Error>(
    getKey,
    (url: string) => {
      const page = new URLSearchParams(url.split("?")[1]).get("page");
      return call.get<T>(method, {
        ...params,
        start: page * params.page_length,
      });
    },
    {
      ...options,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false 
    }
  );

  return {
    ...swrResult,
  };
};
