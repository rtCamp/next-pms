/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * External dependencies.
 */
import { useContext, useEffect } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { useSWRConfig, type Cache } from "swr";
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  unstable_serialize,
} from "swr/infinite";

export type PaginationKey<TPageParams = Record<string, unknown>> = readonly [
  cacheKey: string,
  pageIndex: number,
  pageParams?: TPageParams,
];

type PaginationParams = Record<string, unknown> & {
  page_length?: number;
};

type PaginationOptions<T = any, E = any> = SWRInfiniteConfiguration<T, E> & {
  /** Optional cleanup of cached pages for this query prefix. */
  cacheCleanup?: { signaturePrefix: string };
};

/**
 * Extract the signature from a cached entry. SWR keeps the original key args
 * in `_k`: [signature, pageIndex].
 */
const signatureOf = (entry: unknown): string | undefined => {
  const keyArgs = (entry as { _k?: unknown } | null | undefined)?._k;
  return Array.isArray(keyArgs) && typeof keyArgs[0] === "string"
    ? keyArgs[0]
    : undefined;
};

/**
 * Delete all cached pages for a given prefix, except those of `keep`. Also
 * delete the metadata entry for each deleted signature.
 */
const deletePages = (cache: Cache, prefix: string, keep: string) => {
  for (const key of Array.from(cache.keys())) {
    const signature = signatureOf(cache.get(key));
    if (signature?.startsWith(prefix) && signature !== keep) {
      cache.delete(key);
      cache.delete(
        unstable_serialize((pageIndex: number) => [signature, pageIndex]),
      );
    }
  }
};

/**
 *  Hook to make a GET request to the server with useSWRInfinite support.
 *
 * @param method - name of the method to call (will be dotted path e.g. "frappe.client.get_list")
 * @param getKey - A function that accepts the index and previous page data, and returns the key for that page
 * @param params - Request params for every page. When `page_length` is present,
 * the hook derives an offset `start` value. A key may include page-specific
 * params as the third tuple item to support cursor based pagination.
 * @param options - Optional useSWRInfinite configuration, plus `cacheCleanup` (see PaginationOptions)
 *
 * @typeParam T - Type of the data returned by the method
 * @typeParam E - Type of the error returned by the method
 * @typeParam P - Type of the request params. Must extend `PaginationParams`.
 * @returns The `useSWRInfinite` response for the paginated request. `data` is an array of page responses.
 */
export const usePagination = <
  T = any,
  E = any,
  P extends PaginationParams = PaginationParams,
  TPageParams extends object = Record<string, unknown>,
>(
  method: string,
  getKey: (
    index: number,
    previousPageData: T | null,
  ) => PaginationKey<TPageParams> | null,
  params: P,
  options?: PaginationOptions<T, E>,
): SWRInfiniteResponse<T, E> => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { cache } = useSWRConfig();
  const { cacheCleanup, ...swrOptions } = options ?? {};
  const prefix = cacheCleanup?.signaturePrefix;
  const signature = getKey(0, null)?.[0];

  const result = useSWRInfinite<T, E>(
    getKey,
    ([, pageIndex, pageParams]: PaginationKey<TPageParams>) => {
      const offsetParams =
        params.page_length === undefined
          ? {}
          : { start: pageIndex * params.page_length };

      return call.get<T>(method, {
        ...params,
        ...offsetParams,
        ...pageParams,
      });
    },
    swrOptions,
  );

  // Once the active query settles, drop the cached pages of previous queries.
  // They are kept until then so keepPreviousData can show them while loading.
  const settled = !result.isLoading && !result.error;
  useEffect(() => {
    if (prefix && signature && settled) {
      deletePages(cache, prefix, signature);
    }
  }, [cache, prefix, signature, settled]);

  return result;
};
