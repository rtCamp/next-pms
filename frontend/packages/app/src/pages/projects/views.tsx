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

export const ProjectViewsProvider: FC<PropsWithChildren> = ({ children }) => (
  <ViewsProvider doctype="Project" filterParamKeys={FILTER_PARAM_KEYS}>
    {children}
  </ViewsProvider>
);

export const useProjectViews = useViews;
