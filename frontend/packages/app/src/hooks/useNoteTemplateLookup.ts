/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

const DOCTYPE = "Project Status Update Template";

type NoteTemplateItem = {
  name: string;
  template_name: string;
  title: string;
  description: string;
};

export type NoteTemplateOption = LookupOption & {
  title: string;
  description: string;
};

interface UseNoteTemplateLookupOptions {
  /** Controls whether the template lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Filters templates through backend or_filters on template name and title. */
  query: string;
  /** Caps the number of template rows fetched per request. */
  pageSize?: number;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
}

/**
 * Fetches `Project Status Update Template` records for the note template picker.
 */
export const useNoteTemplateLookup = ({
  shouldFetch,
  query,
  pageSize = 20,
  revalidateOnFocus,
}: UseNoteTemplateLookupOptions) => {
  return useRemoteLookup<NoteTemplateItem[], NoteTemplateItem, NoteTemplateOption>(
    {
      shouldFetch,
      query,
      pageSize,
      revalidateOnFocus,
      params: ({ query: searchQuery, pageSize }) => ({
        doctype: DOCTYPE,
        fields: ["name", "template_name", "title", "description"],
        limit_page_length: pageSize,
        or_filters: searchQuery
          ? [
              [DOCTYPE, "template_name", "like", `%${searchQuery}%`],
              [DOCTYPE, "title", "like", `%${searchQuery}%`],
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
      }),
    },
  );
};
