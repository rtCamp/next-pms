/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type SlackChannelLookupItem = {
  name: string;
  channel_name: string;
};

type SlackChannelLookupResult = SlackChannelLookupItem[];

export type SlackChannelLookupOption = LookupOption;

interface UseSlackChannelLookupOptions {
  /** Controls whether the slack channel lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of channel rows fetched per request. */
  pageSize?: number;
  /** Filters channels through backend or_filters on id and channel name. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: SlackChannelLookupOption | null;
}

/**
 * Fetches Slack Channel records for lookup fields.
 */
export const useSlackChannelLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseSlackChannelLookupOptions) => {
  return useRemoteLookup<
    SlackChannelLookupResult,
    SlackChannelLookupItem,
    SlackChannelLookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Slack Channel",
      fields: ["name", "channel_name"],
      limit_page_length: pageSize,
      or_filters: searchQuery
        ? [
            ["Slack Channel", "name", "like", `%${searchQuery}%`],
            ["Slack Channel", "channel_name", "like", `%${searchQuery}%`],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (channel) => ({
      label: channel.channel_name,
      value: channel.name,
    }),
    selectedOption,
  });
};
