/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type NoteTemplateCategoryItem = {
  name: string;
};

interface UseNoteTemplateCategoryLookupOptions {
  /** Controls whether the category lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Filters categories through a backend name filter. */
  query: string;
  /** Caps the number of category rows fetched per request. */
  pageSize?: number;
  /** Preserves the current list of categories while loading new data. */
  keepPreviousData?: boolean;
}

/**
 * Fetches `Project Status Update Template Category` records for the note template forms.
 */
export const useNoteTemplateCategoryLookup = ({
  shouldFetch,
  query,
  pageSize = 20,
  keepPreviousData,
}: UseNoteTemplateCategoryLookupOptions) => {
  return useRemoteLookup<
    NoteTemplateCategoryItem[],
    NoteTemplateCategoryItem,
    LookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    keepPreviousData,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Project Status Update Template Category",
      fields: ["name"],
      limit_page_length: pageSize,
      filters: searchQuery
        ? [
            [
              "Project Status Update Template Category",
              "name",
              "like",
              `%${searchQuery}%`,
            ],
          ]
        : undefined,
      order_by: "name asc",
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (category) => ({ label: category.name, value: category.name }),
  });
};
