/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type NoteTemplateItem = {
  name: string;
  template_name: string;
  title: string;
  description: string;
  template_description: string | null;
  category: string | null;
};

export type NoteTemplateOption = LookupOption & {
  title: string;
  description: string;
  template_description: string | null;
  category: string | null;
};

interface UseNoteTemplateLookupOptions {
  /** Controls whether the template lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Filters templates through backend or_filters on template name and title. */
  query: string;
  /** Restricts templates to a single category. */
  category?: string;
  /** Caps the number of template rows fetched per request. */
  pageSize?: number;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Preserves the current list of templates while loading new data. */
  keepPreviousData?: boolean;
}

/**
 * Fetches `Project Status Update Template` records for the note template picker.
 */
export const useNoteTemplateLookup = ({
  shouldFetch,
  query,
  category,
  pageSize = 20,
  revalidateOnFocus,
  keepPreviousData,
}: UseNoteTemplateLookupOptions) => {
  return useRemoteLookup<
    NoteTemplateItem[],
    NoteTemplateItem,
    NoteTemplateOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    keepPreviousData,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Project Status Update Template",
      fields: [
        "name",
        "template_name",
        "title",
        "description",
        "template_description",
        "category",
      ],
      limit_page_length: pageSize,
      filters: category
        ? [["Project Status Update Template", "category", "=", category]]
        : undefined,
      or_filters: searchQuery
        ? [
            [
              "Project Status Update Template",
              "template_name",
              "like",
              `%${searchQuery}%`,
            ],
            [
              "Project Status Update Template",
              "title",
              "like",
              `%${searchQuery}%`,
            ],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (template) => ({
      label: template.template_name,
      value: template.name,
      title: template.title,
      description: template.description,
      template_description: template.template_description,
      category: template.category,
    }),
  });
};
