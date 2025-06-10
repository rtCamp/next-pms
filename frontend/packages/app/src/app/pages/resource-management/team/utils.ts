/**
 * Internal dependencies.
 */

import { ResourceTeam } from "../store/types";

export const createFilter = (teamContextState: ResourceTeam) => {
  return {
    employeeName: teamContextState?.filters?.employeeName ?? "",
    businessUnit: teamContextState?.filters?.businessUnit ?? [],
    reportingManager: teamContextState?.filters?.reportingManager ?? "",
    designation: teamContextState?.filters?.designation ?? [],
    allocationType: teamContextState?.filters?.allocationType ?? [],
    skillSearch: teamContextState?.filters?.skillSearch ?? [],
    view: teamContextState?.tableView?.view ?? "planned-vs-capacity",
    combineWeekHours: teamContextState?.tableView?.combineWeekHours ?? false,
  };
};
