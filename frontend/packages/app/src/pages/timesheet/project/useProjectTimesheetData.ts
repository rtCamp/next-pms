/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { getFormatedDate } from "@next-pms/design-system/date";
import { addDays } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import type { ProjectMemberData, WeekGroup } from "./context";
import {
  createInitialProjectTimesheetState,
  projectTimesheetReducer,
} from "./reducer";
import type { ProjectTimesheetApiResponse } from "./types";

type UseProjectTimesheetDataResult = {
  hasMoreWeeks: boolean;
  isLoadingProjectData: boolean;
  weekGroups: WeekGroup[];
  loadData: () => void;
  error: FrappeError | undefined;
};

const EMPLOYEE_PAGE_LENGTH = 10;

export function useProjectTimesheetData(): UseProjectTimesheetDataResult {
  const [state, dispatch] = useReducer(
    projectTimesheetReducer,
    undefined,
    createInitialProjectTimesheetState,
  );

  const {
    data: projectTimesheetData,
    error: projectTimesheetError,
    isLoading: isLoadingProjectData,
  } = useFrappeGetCall<ProjectTimesheetApiResponse>(
    "next_pms.timesheet.api.project.get_project_timesheet_data",
    {
      date: state.weekDate,
      max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
      page_length: String(EMPLOYEE_PAGE_LENGTH),
      start: String(state.employeeStart),
    },
  );

  useEffect(() => {
    if (!projectTimesheetData?.message) {
      return;
    }
    dispatch({
      type: "APPEND_PAGE",
      payload: projectTimesheetData.message,
    });
  }, [projectTimesheetData]);

  const { hasMoreEmployees, hasMoreWeeks, weekGroups } = useMemo(() => {
    const hasMoreEmployees =
      state.pages.length > 0
        ? (state.pages[state.pages.length - 1].has_more ?? false)
        : true;

    const hasMoreWeeks = true;

    const weekMap = new Map<string, WeekGroup>();
    const projectMemberDedup = new Map<string, Set<string>>();

    state.pages.forEach((page) => {
      (page.week_groups ?? []).forEach((week) => {
        if (!weekMap.has(week.start_date)) {
          weekMap.set(week.start_date, {
            key: week.key,
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            projects: [],
          });
        }

        const targetWeek = weekMap.get(week.start_date)!;

        week.projects.forEach((project) => {
          let targetProject = targetWeek.projects.find(
            (weekProject) => weekProject.project === project.project,
          );

          if (!targetProject) {
            targetProject = {
              project: project.project,
              projectName: project.project_name,
              members: [],
            };
            targetWeek.projects.push(targetProject);
          }

          const dedupKey = `${week.start_date}::${project.project}`;
          if (!projectMemberDedup.has(dedupKey)) {
            projectMemberDedup.set(dedupKey, new Set());
          }

          const memberSet = projectMemberDedup.get(dedupKey)!;
          project.members.forEach((member) => {
            if (memberSet.has(member.employee)) {
              return;
            }

            memberSet.add(member.employee);
            const mappedMember: ProjectMemberData = {
              label: member.label,
              employee: member.employee,
              avatarUrl: member.avatar_url,
              tasks: member.tasks,
              holidays: member.holidays,
              leaves: member.leaves,
              workingHour: member.working_hour,
              workingFrequency: member.working_frequency,
              status: member.status,
            };

            targetProject.members.push(mappedMember);
          });
        });
      });
    });

    const weekGroups = Array.from(weekMap.values())
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      )
      .map((week) => ({
        ...week,
        projects: week.projects.sort((a, b) =>
          (a.projectName || a.project).localeCompare(
            b.projectName || b.project,
          ),
        ),
      }));

    return { hasMoreEmployees, hasMoreWeeks, weekGroups };
  }, [state.pages]);

  const loadData = useCallback(() => {
    if (isLoadingProjectData) {
      return;
    }

    if (hasMoreEmployees) {
      dispatch({
        type: "LOAD_MORE_EMPLOYEES",
        payload: { pageLength: EMPLOYEE_PAGE_LENGTH },
      });
      return;
    }

    if (!hasMoreWeeks || weekGroups.length === 0) {
      return;
    }

    const oldestWeek = weekGroups[weekGroups.length - 1];
    dispatch({
      type: "SET_WEEK_DATE",
      payload: getFormatedDate(addDays(oldestWeek.start_date, -1)),
    });
  }, [hasMoreEmployees, hasMoreWeeks, isLoadingProjectData, weekGroups]);

  return {
    hasMoreWeeks,
    isLoadingProjectData,
    weekGroups,
    loadData,
    error: projectTimesheetError,
  };
}
