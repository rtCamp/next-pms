/**
 * External dependencies.
 */
import { useMemo, type PropsWithChildren } from "react";

import { useFrappeGetCall } from "frappe-react-sdk";
import {
  LeadershipViewContext,
  type LeadershipViewContextProps,
} from "./context";
import type {
  LeadershipKPIResponse,
  // AllocationHeatmapResponse,
  // TimeUtilisationResponse,
  // ForecastBreakdownResponse,
  // CalendarTimelineResponse,
  // MyProjectsSummaryResponse,
  // EmployeesOnLeaveResponse,
  // TeamTimesheetsResponse,
} from "./type";

export function LeadershipViewProvider({ children }: PropsWithChildren) {
  const { data: leadershipKPIData } = useFrappeGetCall<LeadershipKPIResponse>(
    "next_pms.api.dashboard.get_leadership_kpis",
    {
      cur_start: "2026-05-21",
      cur_end: "2026-06-19",
      prev_start: "2026-04-21",
      prev_end: "2026-05-20",
    },
  );

  // const { data: allocationData } = useFrappeGetCall<AllocationHeatmapResponse>("next_pms.api.dashboard.get_allocation_heatmap", {
  //   from_date: "2026-05-20",
  //   to_date: "2026-07-19"
  // })
  //
  // const { data: utilizationData } = useFrappeGetCall<TimeUtilisationResponse>("next_pms.api.dashboard.get_time_utilisation")
  // const { data: forecastData } = useFrappeGetCall<ForecastBreakdownResponse>("next_pms.api.dashboard.get_forecast_breakdown")
  // const { data: calendarData } = useFrappeGetCall<CalendarTimelineResponse>("next_pms.api.dashboard.get_calendar_timeline_items", {
  //   from_date: "2026-05-20",
  //   to_date: "2026-07-19"
  // })
  // const { data: projectsData } = useFrappeGetCall<MyProjectsSummaryResponse>("next_pms.api.dashboard.get_my_projects_summary")
  // const { data: onLeaveData } = useFrappeGetCall<EmployeesOnLeaveResponse>("next_pms.api.dashboard.get_employees_on_leave")
  // const { data: timesheetData } = useFrappeGetCall<TeamTimesheetsResponse>("next_pms.api.dashboard.get_team_timesheets")

  const value: LeadershipViewContextProps = useMemo(
    () => ({
      state: {
        leadershipKPIData,
      },
      actions: {},
    }),
    [],
  );

  return (
    <LeadershipViewContext.Provider value={value}>
      {children}
    </LeadershipViewContext.Provider>
  );
}
