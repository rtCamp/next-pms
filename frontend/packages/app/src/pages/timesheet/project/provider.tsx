/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { groupTasksByProject } from "@/components/timesheet-row/utils";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { DataProp, timesheet } from "@/types/timesheet";
import {
  ProjectTimesheetContext,
  type EmployeeRecord,
  type ProjectMemberData,
  type ProjectTimesheetContextProps,
  type WeekGroup,
  type WeekProjectGroup,
} from "./context";

type CompactWeek = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
};

type TimesheetFetchRequest = {
  employee: string;
  startDate: string;
  requestKey: string;
};

type ProjectRecord = {
  name: string;
  project_name: string;
};

const mergeEmployeeTimesheetData = (
  existing: DataProp | undefined,
  payload: DataProp,
) => {
  if (!existing) return payload;

  const existingLeaveIds = new Set(existing.leaves.map((leave) => leave.name));
  const existingHolidayDates = new Set(
    existing.holidays.map((holiday) => holiday.holiday_date),
  );

  return {
    ...existing,
    data: {
      ...existing.data,
      ...payload.data,
    },
    leaves: [
      ...existing.leaves,
      ...payload.leaves.filter((leave) => !existingLeaveIds.has(leave.name)),
    ],
    holidays: [
      ...existing.holidays,
      ...payload.holidays.filter(
        (holiday) => !existingHolidayDates.has(holiday.holiday_date),
      ),
    ],
  };
};

// TODO: Refactor to use direct API call when API is ready.
export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const toast = useToasts();
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [hasMoreWeeks, setHasMoreWeeks] = useState(true);
  const [compactWeeks, setCompactWeeks] = useState<Record<string, CompactWeek>>(
    {},
  );
  const [memberMap, setMemberMap] = useState<Record<string, EmployeeRecord>>(
    {},
  );
  const [projectMap, setProjectMap] = useState<Record<string, ProjectRecord>>(
    {},
  );
  const [employeeTimesheetMap, setEmployeeTimesheetMap] = useState<
    Record<string, DataProp>
  >({});
  const [pendingTimesheetRequests, setPendingTimesheetRequests] = useState<
    TimesheetFetchRequest[]
  >([]);
  const [fetchedRequestKeys, setFetchedRequestKeys] = useState<
    Record<string, boolean>
  >({});

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const clearLoadedData = useCallback(() => {
    setEmployeeTimesheetMap({});
    setCompactWeeks({});
    setMemberMap({});
    setPendingTimesheetRequests([]);
    setFetchedRequestKeys({});
  }, []);

  const {
    data: projectsData,
    error: projectsError,
    isLoading: isLoadingProjects,
  } = useFrappeGetCall("next_pms.timesheet.api.project.get_projects", {
    limit: "100",
    start: "0",
  });

  const {
    data: compactViewData,
    error: compactViewError,
    isLoading: isLoadingCompactView,
  } = useFrappeGetCall("next_pms.timesheet.api.team.get_compact_view_data", {
    date: weekDate,
    max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
    reports_to: employeeId,
    page_length: "100",
    start: "0",
  });

  const activeTimesheetRequest = pendingTimesheetRequests[0] ?? null;

  const {
    data: memberTimesheetData,
    error: memberTimesheetError,
    isLoading: isLoadingActiveTimesheetRequest,
  } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    activeTimesheetRequest
      ? {
          employee: activeTimesheetRequest.employee,
          start_date: activeTimesheetRequest.startDate,
          max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
        }
      : undefined,
    activeTimesheetRequest ? undefined : null,
  );

  const appendCompactWeeks = useCallback((weeks: CompactWeek[]) => {
    setCompactWeeks((prev) => {
      const next = { ...prev };

      weeks.forEach((week) => {
        const weekId = week.start_date;
        next[weekId] = week;
      });

      return next;
    });
  }, []);

  const appendMembers = useCallback((members: EmployeeRecord[]) => {
    setMemberMap((prev) => {
      const next = { ...prev };
      members.forEach((member) => {
        next[member.name] = member;
      });
      return next;
    });
  }, []);

  const queueMemberRequests = useCallback(
    (members: EmployeeRecord[]) => {
      const membersToFetch = members.filter((member) => {
        const requestKey = `${weekDate}::${member.name}`;
        return !fetchedRequestKeys[requestKey];
      });

      if (membersToFetch.length === 0) return;

      setPendingTimesheetRequests((prev) => {
        const existingKeys = new Set(prev.map((request) => request.requestKey));
        const next = [...prev];

        membersToFetch.forEach((member) => {
          const requestKey = `${weekDate}::${member.name}`;
          if (existingKeys.has(requestKey)) return;

          next.push({
            employee: member.name,
            startDate: weekDate,
            requestKey,
          });
        });

        return next;
      });

      setFetchedRequestKeys((prev) => {
        const next = { ...prev };
        membersToFetch.forEach((member) => {
          const requestKey = `${weekDate}::${member.name}`;
          next[requestKey] = true;
        });
        return next;
      });
    },
    [fetchedRequestKeys, weekDate],
  );

  useEffect(() => {
    if (!employeeId) {
      clearLoadedData();
      setHasMoreWeeks(false);
    }
  }, [clearLoadedData, employeeId]);

  useEffect(() => {
    if (!projectsError) return;

    const message = parseFrappeErrorMsg(projectsError as never);
    toast.error(message || "Failed to load projects.");
  }, [projectsError, toast]);

  useEffect(() => {
    if (!projectsData?.message?.data) return;

    const projects = projectsData.message.data as ProjectRecord[];
    const nextMap: Record<string, ProjectRecord> = {};

    projects.forEach((project) => {
      nextMap[project.name] = project;
    });

    setProjectMap(nextMap);
  }, [projectsData]);

  useEffect(() => {
    if (!employeeId || !compactViewError) return;

    const message = parseFrappeErrorMsg(compactViewError as never);
    setPendingTimesheetRequests([]);
    setHasMoreWeeks(false);
    toast.error(message || "Failed to load project timesheets.");
  }, [compactViewError, employeeId, toast]);

  useEffect(() => {
    if (!employeeId || !compactViewData?.message) {
      return;
    }

    const compactPayload = compactViewData.message as {
      data?: Record<string, EmployeeRecord>;
      dates?: CompactWeek[];
    };
    const compactWeekEntries = compactPayload.dates ?? [];

    appendCompactWeeks(compactWeekEntries);
    setHasMoreWeeks(compactWeekEntries.length === NUMBER_OF_WEEKS_TO_FETCH);

    const compactMembers = Object.values(compactPayload.data ?? {})
      .filter((member) => member.name)
      .map((member) => ({
        name: member.name,
        employee_name: member.employee_name,
        image: member.image,
      }));

    appendMembers(compactMembers);
    queueMemberRequests(compactMembers);
  }, [
    appendCompactWeeks,
    appendMembers,
    compactViewData,
    employeeId,
    queueMemberRequests,
  ]);

  useEffect(() => {
    if (!activeTimesheetRequest) return;

    if (memberTimesheetError) {
      setFetchedRequestKeys((prev) => {
        const next = { ...prev };
        delete next[activeTimesheetRequest.requestKey];
        return next;
      });
      setPendingTimesheetRequests((prev) => prev.slice(1));
      return;
    }

    const payload = memberTimesheetData?.message as DataProp | undefined;
    if (!payload) return;

    setEmployeeTimesheetMap((prev) => {
      return {
        ...prev,
        [activeTimesheetRequest.employee]: mergeEmployeeTimesheetData(
          prev[activeTimesheetRequest.employee],
          payload,
        ),
      };
    });

    setPendingTimesheetRequests((prev) => prev.slice(1));
  }, [activeTimesheetRequest, memberTimesheetData, memberTimesheetError]);

  useEffect(() => {
    clearLoadedData();
    setHasMoreWeeks(true);
    setWeekDate(getTodayDate());
  }, [clearLoadedData, employeeId]);

  const weekGroups = useMemo(() => {
    const knownProjectIds = Object.keys(projectMap);
    const shouldFilterByProjects = knownProjectIds.length > 0;

    const weekMap = new Map<string, WeekGroup>(
      Object.values(compactWeeks).map((week) => {
        const weekId = week.start_date;
        return [
          weekId,
          {
            key: week.key,
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            projects: [],
          } as WeekGroup,
        ];
      }),
    );

    Object.entries(memberMap).forEach(([employeeIdKey, member]) => {
      const employeePayload = employeeTimesheetMap[employeeIdKey];
      if (!employeePayload?.data) return;

      Object.values(employeePayload.data).forEach((week: timesheet) => {
        const weekProjects = groupTasksByProject(week.tasks).filter(
          (project) => {
            if (Object.keys(project.tasks).length === 0) {
              return false;
            }
            if (!shouldFilterByProjects) {
              return true;
            }
            return Object.hasOwn(projectMap, project.project);
          },
        );

        if (weekProjects.length === 0) {
          return;
        }

        const weekId = week.start_date;
        if (!weekMap.has(weekId)) {
          weekMap.set(weekId, {
            key: week.key,
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            projects: [],
          });
        }

        const targetWeek = weekMap.get(weekId)!;

        weekProjects.forEach((project) => {
          const projectName =
            projectMap[project.project]?.project_name ?? project.project_name;

          let targetProject = targetWeek.projects.find(
            (weekProject) => weekProject.project === project.project,
          );

          if (!targetProject) {
            targetProject = {
              project: project.project,
              projectName,
              members: [],
            } as WeekProjectGroup;
            targetWeek.projects.push(targetProject);
          }

          targetProject.members.push({
            employee: member,
            week,
            projectTasks: project.tasks,
            holidays: employeePayload.holidays,
            leaves: employeePayload.leaves,
            working_hour: employeePayload.working_hour,
            working_frequency: employeePayload.working_frequency,
          } as ProjectMemberData);
        });
      });
    });

    return Array.from(weekMap.values())
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
  }, [compactWeeks, employeeTimesheetMap, memberMap, projectMap]);

  const isLoadingMemberTimesheets =
    pendingTimesheetRequests.length > 0 ||
    Boolean(activeTimesheetRequest && isLoadingActiveTimesheetRequest);
  const isLoadingProjectData =
    isLoadingProjects || isLoadingCompactView || isLoadingMemberTimesheets;

  const loadData = useCallback(() => {
    if (!hasMoreWeeks || isLoadingProjectData || weekGroups.length === 0)
      return;

    const oldestWeek = weekGroups[weekGroups.length - 1];
    setWeekDate(getFormatedDate(addDays(oldestWeek.start_date, -1)));
  }, [hasMoreWeeks, isLoadingProjectData, weekGroups]);

  useEffect(() => {
    if (!memberTimesheetError || !activeTimesheetRequest) return;

    const message = parseFrappeErrorMsg(memberTimesheetError as never);
    toast.error(message || "Failed to load member timesheet.");
  }, [activeTimesheetRequest, memberTimesheetError, toast]);

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
