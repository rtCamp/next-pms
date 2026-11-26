import {
  computed,
  onScopeDispose,
  reactive,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { useCall } from "frappe-ui";

/** A combobox option from a remote lookup. */
export interface LookupOption {
  label: string;
  value: string;
  description?: string;
  /** frappe-ui class icon, e.g. `"lucide-folder"`. */
  icon?: string;
  /** Avatar image of a person option. */
  image?: string;
  disabled?: boolean;
}

type LookupParams = Record<string, string | number | undefined>;

export interface RemoteLookupOptions<
  TResponse,
  TItem,
  TOption extends LookupOption = LookupOption,
> {
  /** Whitelisted method, e.g. `"frappe.client.get_list"`. */
  method: string;
  /** Fetch only while this is true, e.g. while a dialog is open. Default: `true`. */
  enabled?: MaybeRefOrGetter<boolean>;
  /** The user's search text; requests follow it after `debounceMs`. */
  query: MaybeRefOrGetter<string>;
  /** Default: 300. */
  debounceMs?: number;
  /** Request params for a search. Lists must be JSON strings (GET params). */
  params: (query: string) => LookupParams;
  /** The rows in the response. */
  getItems: (response: TResponse | null) => TItem[];
  toOption: (item: TItem) => TOption;
  /** Options kept in the list when the latest results don't include them, e.g. the current value. */
  selected?: MaybeRefOrGetter<TOption | null | undefined>;
  /** Other inputs of `params`; a change searches again at once, e.g. a project scope. */
  refetchOn?: () => unknown;
}

/**
 * Searches a whitelisted method as the user types and maps the results to combobox
 * options. Pair it with `<Combobox :filterable="false">`, since the server does the
 * filtering.
 */
export function useRemoteLookup<
  TResponse,
  TItem,
  TOption extends LookupOption = LookupOption,
>(options: RemoteLookupOptions<TResponse, TItem, TOption>) {
  const debouncedQuery = ref(toValue(options.query));
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => toValue(options.query),
    (query) => {
      clearTimeout(timer);
      timer = setTimeout(
        () => (debouncedQuery.value = query),
        options.debounceMs ?? 300,
      );
    },
  );
  onScopeDispose(() => clearTimeout(timer));

  const call = useCall<TResponse, LookupParams>({
    url: `/api/v2/method/${options.method}`,
    params: () => options.params(debouncedQuery.value),
    immediate: false,
  });

  watch(
    [
      () => toValue(options.enabled ?? true),
      debouncedQuery,
      () => options.refetchOn?.(),
    ],
    ([enabled]) => {
      if (enabled) call.fetch();
    },
    { immediate: true },
  );

  const lookupOptions = computed<TOption[]>(() => {
    const results = options.getItems(call.data).map(options.toOption);
    const selected = toValue(options.selected);
    if (
      !selected ||
      results.some((option) => option.value === selected.value)
    ) {
      return results;
    }
    return [selected, ...results];
  });

  return reactive({
    options: lookupOptions,
    loading: computed(() => call.loading),
    error: computed(() => call.error),
  });
}
