/**
 * External dependencies.
 */
import { FC, PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { useViews } from "@/providers/views";
import { ViewsProvider } from "@/providers/views/provider";
import { FILTER_PARAM_KEYS } from "./components/project-filters/useProjectFilters";
import { DEFAULT_PROJECT_VIEWS } from "./constants";

export const ProjectViewsProvider: FC<PropsWithChildren> = ({ children }) => (
  <ViewsProvider
    doctype="Project"
    defaultViews={DEFAULT_PROJECT_VIEWS}
    filterParamKeys={FILTER_PARAM_KEYS}
  >
    {children}
  </ViewsProvider>
);

export const useProjectViews = useViews;
