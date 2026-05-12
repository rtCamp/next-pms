/**
 * External Dependencies.
 */
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal Dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";

type FrappeResponse<T> = {
  message: T;
};

export type LookupOption = {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
};

interface UseRemoteLookupOptions<
  TMessage,
  TItem,
  TOption extends LookupOption,
> {
  /** Controls whether the remote lookup request should run for the current UI state. */
  shouldFetch: boolean;
  /** Raw user search text before debounce is applied. */
  query: string;
  /** Wait time before firing a new request for the latest query. */
  debounceMs?: number;
  /** Max number of rows requested from the backend. */
  pageSize?: number;
  /** Fully qualified Frappe method used for the lookup request. */
  method: string;
  /** Builds backend params from the debounced query and page size. */
  params: (args: {
    query: string;
    pageSize: number;
  }) => Record<string, unknown>;
  /** Extracts the list payload from the backend response message. */
  getItems: (message: TMessage | undefined) => TItem[];
  /** Maps each backend item into a combobox option shape. */
  mapOption: (item: TItem) => TOption;
  /** Preserves the current selection when it is missing from the latest page. */
  selectedOption?: TOption | null;
}

/**
 * Runs a debounced GET lookup and keeps the selected option visible across queries.
 */
export const useRemoteLookup = <TMessage, TItem, TOption extends LookupOption>({
  shouldFetch,
  query,
  debounceMs = 300,
  pageSize = 20,
  method,
  params,
  getItems,
  mapOption,
  selectedOption,
}: UseRemoteLookupOptions<TMessage, TItem, TOption>) => {
  const debouncedQuery = useDebounce(query, debounceMs);
  const { data, isLoading, error } = useFrappeGetCall<FrappeResponse<TMessage>>(
    method,
    params({ query: debouncedQuery, pageSize }),
    shouldFetch ? undefined : null,
    {
      revalidateOnFocus: false,
    },
  );

  const options = useMemo(() => {
    const nextOptions = getItems(data?.message).map(mapOption);

    if (!selectedOption) {
      return nextOptions;
    }

    if (nextOptions.some((option) => option.value === selectedOption.value)) {
      return nextOptions;
    }

    return [selectedOption, ...nextOptions];
  }, [data?.message, getItems, mapOption, selectedOption]);

  return {
    options,
    isLoading,
    error,
  };
};
