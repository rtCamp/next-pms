/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { View } from "@/types";

export interface ViewsContextProps {
  state: {
    /** DocType this provider instance is scoped to. */
    doctype: string;
    /** Saved views for the doctype available to the current user (own + public). */
    views: View[];
    /** Indicates whether views are still being fetched. */
    isLoading: boolean;
  };
  actions: {
    /** Creates a new view for the provider's doctype and refreshes the list. */
    createView: (args?: {
      type?: string;
      filters?: Record<string, unknown>;
    }) => void;
    /** Updates an existing view and refreshes the list. */
    updateView: (view: Partial<View>) => Promise<void>;
    /** Re-fetches the views from the server. */
    refresh: () => Promise<void>;
  };
}

export const ViewsContext = createContext<ViewsContextProps>({
  state: {
    doctype: "",
    views: [],
    isLoading: false,
  },
  actions: {
    createView: () => null,
    updateView: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  },
});

export const useViews = <T>(
  selector: (state: ViewsContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(ViewsContext, selector);
};
