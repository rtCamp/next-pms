import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface DesignationItem {
  name: string;
}

export interface DesignationLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/** Searches the designations active employees hold, most used first (`get_designations`). */
export function useDesignationLookup(options: DesignationLookupOptions) {
  return useRemoteLookup<DesignationItem[] | null, DesignationItem>({
    method: "next_pms.api.designation.get_designations",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      search: query || undefined,
      page_length: 20,
      start: 0,
    }),
    getItems: (response) => response ?? [],
    toOption: (designation) => ({
      label: designation.name,
      value: designation.name,
    }),
  });
}
