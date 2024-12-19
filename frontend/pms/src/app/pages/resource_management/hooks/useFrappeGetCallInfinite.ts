/**
 * External dependencies.
 */
import { useContext } from "react";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from "swr/infinite";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { StrictTupleKey } from "swr/_internal";

/**
 *  Hook to make a GET request to the server with pagination
 *
 * @param method - name of the method to call (will be dotted path e.g. "frappe.client.get_list")
 * @param getKey - A function that accepts the index and the previous page data, returns the key of a page
 * @param options [Optional] SWRConfiguration options for fetching data
 *
 * @typeParam T - Type of the data returned by the method
 * @returns an object (SWRResponse) with the following properties: data (number), error, isValidating, and mutate
 */
export const useFrappeGetCallInfinite = <T = any>(
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
    options
  );

  return {
    ...swrResult,
  };
};
