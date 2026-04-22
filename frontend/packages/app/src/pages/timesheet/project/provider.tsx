/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  ProjectTimesheetContext,
  type ProjectTimesheetContextProps,
} from "./context";
import { useProjectTimesheetData } from "./useProjectTimesheetData";

export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const toast = useToasts();

  const { hasMoreWeeks, isLoadingProjectData, weekGroups, loadData, error } =
    useProjectTimesheetData();

  useEffect(() => {
    if (!error) return;

    const message = parseFrappeErrorMsg(error as FrappeError);
    toast.error(message || "Failed to load project timesheets.");
  }, [error, toast]);

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
