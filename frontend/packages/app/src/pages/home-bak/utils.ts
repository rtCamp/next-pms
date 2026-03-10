/**
 * Internal dependencies.
 */

import { HomeState } from "./types";

export const createFilter = (homeState: HomeState) => {
  return {
    employeeName: homeState?.employeeName ?? "",
    status: homeState?.status ?? ["Active"],
  };
};
