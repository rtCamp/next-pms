/**
 * External dependencies.
 */
import { useEffect, useMemo, useCallback, useState } from "react";
import { Spinner, Typography } from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { TextInput, useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROLES } from "@/lib/constant";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { WorkingFrequency } from "@/types";
import type { DataProp, timesheet } from "@/types/timesheet";
import WeeklyApproval from "./weeklyApproval";
import { InfiniteScroll } from "../../../components/infiniteScroll";
import { HeaderRow } from "../../../components/timesheet-row/components/row/headerRow";
import { TeamTimesheetRow } from "../../../components/timesheet-row/teamTimesheetRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "../constants";

type EmployeeRecord = {
  name: string;
  image: string;
  employee_name: string;
};

type WeekEmployeeData = {
  employee: EmployeeRecord;
  week: timesheet;
  holidays: DataProp["holidays"];
  leaves: DataProp["leaves"];
  working_hour: number;
  working_frequency: WorkingFrequency;
};

type WeekGroup = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
  members: WeekEmployeeData[];
};

type CompactWeek = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
};

function TeamTimesheet() {
  const toast = useToasts();
  const [search, setSearch] = useState("");
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [hasMoreWeeks, setHasMoreWeeks] = useState(true);
  const [hasCompactPermission, setHasCompactPermission] = useState(true);

  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(false);
  const [compactWeeks, setCompactWeeks] = useState<Record<string, CompactWeek>>({});
  const [memberMap, setMemberMap] = useState<Record<string, EmployeeRecord>>({});
  const [employeeTimesheetMap, setEmployeeTimesheetMap] = useState<Record<string, DataProp>>({});
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);

  const { employeeId, roles } = useUser(({ state }) => ({
    employeeId: state.employeeId,
    roles: state.roles,
  }));
  const { call: getCompactViewData } = useFrappePostCall("next_pms.timesheet.api.team.get_compact_view_data");
  const { call: getTimesheetData } = useFrappePostCall("next_pms.timesheet.api.timesheet.get_timesheet_data");

  /**
   * Opens the weekly approval modal for a specific employee's timesheet.
   *
   * @param employeeId - The unique identifier of the employee (e.g., "HR-EMP-00001")
   * @param date - The start date of the week to review in "YYYY-MM-DD" format
   */
  const openWeeklyApproval = useCallback((employeeId: string, date: string) => {
    setEmployee(employeeId);
    setStartDate(date);
    setIsWeeklyApprovalOpen(true);
  }, []);

  useEffect(() => {
    const canAccessCompactView = roles.some((role) => ROLES.includes(role));

    if (!canAccessCompactView) {
      setHasCompactPermission(false);
      setHasMoreWeeks(false);
      setIsLoadingTeamData(false);
      setEmployeeTimesheetMap({});
      setMemberMap({});
      return;
    }

    setHasCompactPermission(true);

    if (!employeeId) {
      setEmployeeTimesheetMap({});
      setMemberMap({});
      setIsLoadingTeamData(false);
      return;
    }

    let cancelled = false;
    setIsLoadingTeamData(true);

    const fetchTeamData = async () => {
      const compactPayload = (await getCompactViewData({
        date: weekDate,
        max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
        reports_to: employeeId,
        page_length: "100",
        start: "0",
      })) as {
        message?: {
          data?: Record<string, EmployeeRecord>;
          dates?: CompactWeek[];
          has_more?: boolean;
        };
      };

      const compactWeekEntries = compactPayload.message?.dates ?? [];
      if (!cancelled) {
        setCompactWeeks((prev) => {
          const next = { ...prev };
          compactWeekEntries.forEach((week) => {
            const weekId = `${week.start_date}::${week.end_date}`;
            next[weekId] = week;
          });
          return next;
        });
      }

      const compactMembers = Object.values(compactPayload.message?.data ?? {})
        .filter((member) => member.name)
        .map((member) => ({
          name: member.name,
          employee_name: member.employee_name,
          image: member.image,
        }));

      if (!compactPayload.message?.has_more && compactMembers.length === 0) {
        setHasMoreWeeks(false);
      }

      if (!cancelled) {
        setMemberMap((prev) => {
          const next = { ...prev };
          compactMembers.forEach((member) => {
            next[member.name] = member;
          });
          return next;
        });
      }

      if (compactMembers.length === 0) {
        setHasMoreWeeks(false);
        return;
      }

      const requests = compactMembers.map(async (member) => {
        const payload = (await getTimesheetData({
          employee: member.name,
          start_date: weekDate,
          max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
        })) as { message?: DataProp };
        return { employee: member.name, payload: payload.message };
      });

      const settled = await Promise.allSettled(requests);

      if (!cancelled) {
        setEmployeeTimesheetMap((prev) => {
          const mapped = { ...prev };

          settled.forEach((result) => {
            if (result.status !== "fulfilled" || !result.value.payload) return;

            const { employee, payload } = result.value;
            const existing = mapped[employee];

            if (!existing) {
              mapped[employee] = payload;
              return;
            }

            const existingLeaveIds = new Set(existing.leaves.map((leave) => leave.name));
            const existingHolidayDates = new Set(existing.holidays.map((holiday) => holiday.holiday_date));

            mapped[employee] = {
              ...existing,
              data: {
                ...existing.data,
                ...payload.data,
              },
              leaves: [...existing.leaves, ...payload.leaves.filter((leave) => !existingLeaveIds.has(leave.name))],
              holidays: [
                ...existing.holidays,
                ...payload.holidays.filter((holiday) => !existingHolidayDates.has(holiday.holiday_date)),
              ],
            };
          });

          return mapped;
        });
      }

      const failed = settled.filter((result) => result.status === "rejected").length;
      if (failed > 0) {
        toast.error(`Failed to load ${failed} member timesheet(s).`);
      }
    };

    fetchTeamData()
      .catch((error) => {
        const message = parseFrappeErrorMsg(error as never);
        if (message.includes("This action is only allowed for")) {
          setHasCompactPermission(false);
        }
        setHasMoreWeeks(false);
        toast.error(message || "Failed to load team timesheets.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTeamData(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId, getCompactViewData, getTimesheetData, roles, toast, weekDate]);

  useEffect(() => {
    setEmployeeTimesheetMap({});
    setCompactWeeks({});
    setMemberMap({});
    setHasMoreWeeks(true);
    setHasCompactPermission(true);
    setWeekDate(getTodayDate());
  }, [employeeId]);

  const weekGroups = useMemo(() => {
    const weekMap = new Map<string, WeekGroup>(
      Object.values(compactWeeks).map((week) => {
        const weekId = `${week.start_date}::${week.end_date}`;
        return [
          weekId,
          {
            key: week.key,
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            members: [],
          } as WeekGroup,
        ];
      }),
    );

    Object.entries(memberMap).forEach(([employeeIdKey, member]) => {
      const employeePayload = employeeTimesheetMap[employeeIdKey];
      if (!employeePayload?.data) return;

      Object.values(employeePayload.data).forEach((week) => {
        if (week.status === "Not Submitted") {
          return;
        }

        const weekId = `${week.start_date}::${week.end_date}`;
        if (!weekMap.has(weekId)) {
          weekMap.set(weekId, {
            key: week.key,
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            members: [],
          });
        }
        weekMap.get(weekId)!.members.push({
          employee: member,
          week,
          holidays: employeePayload.holidays,
          leaves: employeePayload.leaves,
          working_hour: employeePayload.working_hour,
          working_frequency: employeePayload.working_frequency,
        });
      });
    });

    const groups = Array.from(weekMap.values()).sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );

    return groups.map((group) => {
      const query = search.trim().toLowerCase();
      if (!query) return group;

      const filteredMembers = group.members.filter((member) => {
        if (member.employee.employee_name.toLowerCase().includes(query)) {
          return true;
        }

        return Object.values(member.week.tasks).some((task) =>
          [task.name, task.subject, task.project_name || task.project].join(" ").toLowerCase().includes(query),
        );
      });

      return { ...group, members: filteredMembers };
    });
  }, [compactWeeks, employeeTimesheetMap, memberMap, search]);

  const loadData = () => {
    if (!hasMoreWeeks || isLoadingTeamData || weekGroups.length === 0) return;

    const oldestWeek = weekGroups[weekGroups.length - 1];
    setWeekDate(getFormatedDate(addDays(oldestWeek.start_date, -1)));
  };

  const hasData = weekGroups.length > 0;

  return (
    <div className="w-full h-full py-3.5 px-3">
      <div className="flex justify-between mb-3.5">
        <TextInput
          placeholder="Search Member or Task"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </div>

      {isLoadingTeamData ? (
        <Spinner isFull />
      ) : !hasCompactPermission ? (
        <Typography className="flex items-center justify-center">
          You do not have permission to view Team Timesheets.
        </Typography>
      ) : !hasData ? (
        <Typography className="flex items-center justify-center">No Data</Typography>
      ) : (
        <InfiniteScroll
          isLoading={isLoadingTeamData}
          hasMore={hasMoreWeeks}
          verticalLodMore={loadData}
          className="w-full h-full overflow-auto scrollbar [scrollbar-gutter:stable]"
          count={NUMBER_OF_WEEKS_TO_FETCH}
        >
          <div className="min-w-225">
            {weekGroups.map((week, index) => {
              return (
                <div key={`${week.start_date}-${week.end_date}`} className="animate-fade-in">
                  {index === 0 ? (
                    <div className="mb-4 sticky top-0 bg-surface-white z-10">
                      <HeaderRow
                        dates={week.dates}
                        showHeading={true}
                        breadcrumbs={{
                          items: [
                            { label: "Week", interactive: false },
                            { label: "Member", interactive: false },
                            { label: "Project", interactive: false },
                            { label: "Task", interactive: false },
                          ],
                          highlightLastItem: false,
                          size: "sm",
                          crumbClassName: "first:pl-0 last:pr-0",
                          className: "pl-[8px]",
                        }}
                      />
                    </div>
                  ) : null}

                  <TeamTimesheetRow
                    label={week.key}
                    dates={week.dates}
                    firstWeek={index === 0}
                    disabled={true}
                    teamMembers={week.members.map((member) => ({
                      label: member.employee.employee_name,
                      employee: member.employee.name,
                      avatarUrl: member.employee.image,
                      tasks: member.week.tasks,
                      leaves: member.leaves,
                      holidays: member.holidays,
                      workingHour: member.working_hour,
                      workingFrequency: member.working_frequency,
                      status: member.week.status,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      )}
      {employee !== "" && (
        <WeeklyApproval
          employee={employee}
          startDate={startDate}
          open={isWeeklyApprovalOpen}
          onOpenChange={setIsWeeklyApprovalOpen}
        />
      )}
    </div>
  );
}

export default TeamTimesheet;
