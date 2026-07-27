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
    /** Views for the doctype: provider-supplied defaults followed by the current user's saved views (own + public). */
    views: View[];
    /** Built-in views supplied by the provider, always available. */
    defaultViews: View[];
    /** Saved views for the doctype available to the current user (own + public). */
    savedViews: View[];
    /** View currently selected via the `view` search param, if any. */
    activeView: View | undefined;
    /** Indicates whether views are still being fetched. */
    isLoading: boolean;
  };
  actions: {
    /** Creates a new view for the provider's doctype and refreshes the list. */
    createView: (args?: {
      type?: string;
      filters?: Record<string, unknown>;
    }) => void;
    /** Selects a view: syncs the `view`, filter and sort search params to it. */
    applyView: (view: View, options?: { replace?: boolean }) => void;
    /** Opens the edit-view modal prefilled with the given saved view. */
    editView: (view: View) => void;
    /** Updates an existing view and refreshes the list. The provider's doctype is applied automatically. */
    updateView: (view: Omit<Partial<View>, "dt">) => Promise<void>;
    /** Deletes a saved view by name and refreshes the list. */
    deleteView: (name: string) => Promise<void>;
    /** Re-fetches the views from the server. */
    refresh: () => Promise<void>;
  };
}

export const ViewsContext = createContext<ViewsContextProps>({
  state: {
    views: [],
    defaultViews: [],
    savedViews: [],
    activeView: undefined,
    isLoading: false,
  },
  actions: {
    createView: () => null,
    applyView: () => null,
    editView: () => null,
    updateView: () => Promise.resolve(),
    deleteView: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  },
});

export const useViews = <T>(
  selector: (state: ViewsContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(ViewsContext, selector);
};
