/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useMemo } from "react";

/**
 * Internal dependencies.
 */
import {
  ProjectTimesheetContext,
  type ProjectTimesheetContextProps,
} from "./context";
import { useProjectTimesheetData } from "./useProjectTimesheetData";

export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { hasMoreWeeks, isLoadingProjectData, weekGroups, loadData } =
    useProjectTimesheetData();

  const value: ProjectTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks,
        isLoadingProjectData,
        weekGroups,
      },
      actions: {
        loadData,
      },
    }),
    [hasMoreWeeks, isLoadingProjectData, loadData, weekGroups],
  );

  return (
    <ProjectTimesheetContext.Provider value={value}>
      {children}
    </ProjectTimesheetContext.Provider>
  );
};
