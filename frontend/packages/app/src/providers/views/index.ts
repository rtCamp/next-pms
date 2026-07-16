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
    /** Saved views available to the current user (own + public). */
    views: View[];
    /** Indicates whether views are still being fetched. */
    isLoading: boolean;
  };
  actions: {
    /** Returns the subset of views bound to a given DocType. */
    getViewsForDoctype: (dt: string) => View[];
    /** Creates a new view and refreshes the list. */
    createView: (view: Partial<View>) => Promise<void>;
    /** Updates an existing view and refreshes the list. */
    updateView: (view: Partial<View>) => Promise<void>;
    /** Re-fetches the views from the server. */
    refresh: () => Promise<void>;
  };
}

export const ViewsContext = createContext<ViewsContextProps>({
  state: {
    views: [],
    isLoading: false,
  },
  actions: {
    getViewsForDoctype: () => [],
    createView: () => Promise.resolve(),
    updateView: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  },
});

export const useViews = <T>(
  selector: (state: ViewsContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(ViewsContext, selector);
};
