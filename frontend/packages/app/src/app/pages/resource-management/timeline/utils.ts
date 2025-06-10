/**
 * Internal dependencies.
 */

import { TimeLineContextState } from "../store/types";

export const createFilter = (timelineState: TimeLineContextState) => {
  return {
    employeeName: timelineState?.filters?.employeeName ?? "",
    businessUnit: timelineState?.filters?.businessUnit ?? [],
    reportingManager: timelineState?.filters?.reportingManager ?? "",
    designation: timelineState?.filters?.designation ?? [],
    allocationType: timelineState?.filters?.allocationType ?? [],
    skillSearch: timelineState?.filters?.skillSearch ?? [],
    isShowMonth: timelineState?.filters?.isShowMonth ?? false,
  };
};
