/**
 * Internal dependencies.
 */

import { ResourceProject } from "../store/types";

export const createFilter = (projectContextState: ResourceProject) => {
  return {
    projectName: projectContextState?.filters?.projectName ?? "",
    customer: projectContextState?.filters?.customer ?? [],
    reportingManager: projectContextState?.filters?.reportingManager ?? "",
    billingType: projectContextState?.filters?.billingType ?? [
      "Retainer",
      "Fixed Cost",
      "Time and Material",
    ],
    allocationType: projectContextState?.filters?.allocationType ?? [],
    view: projectContextState?.tableView?.view ?? "planned",
    combineWeekHours: projectContextState?.tableView?.combineWeekHours ?? false,
  };
};
