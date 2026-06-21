/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import {
  Avatar,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRowItem,
  ListRows,
  ListView,
  Select,
} from "@rtcamp/frappe-ui-react";
import { differenceInCalendarDays, startOfMonth, startOfWeek } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  LAST_WEEK_VALUE,
  PERIOD_OPTIONS,
  THIS_MONTH_VALUE,
  THIS_WEEK_VALUE,
  TIMESHEET_COLUMNS,
} from "./constants";
import { TimesheetsSkeleton } from "./skeleton";
import { StatusIcon } from "./statusIcon";
import type { TeamTimesheetsResponse, WeeklyApprovalStatus } from "../../types";

const HOURS = (value: number) => `${value}h`;

function periodToDays(period: string): number {
  const today = new Date();
  if (period === THIS_WEEK_VALUE) {
    return (
      differenceInCalendarDays(today, startOfWeek(today, { weekStartsOn: 1 })) +
      1
    );
  }
  if (period === THIS_MONTH_VALUE) {
    return differenceInCalendarDays(today, startOfMonth(today)) + 1;
  }
  return 7;
}

type TimesheetRow = {
  employee: string;
  name: string;
  image: string | null;
  billable: number;
  nonBillable: number;
  expected: number;
  delta: number;
  status: WeeklyApprovalStatus;
};

export default function Timesheets() {
  const [period, setPeriod] = useState<string>(LAST_WEEK_VALUE);

  const days = useMemo(() => periodToDays(period), [period]);

  const { data, isLoading } = useFrappeGetCall<TeamTimesheetsResponse>(
    "next_pms.api.dashboard.get_team_timesheets",
    { days },
  );

  const rows = useMemo<TimesheetRow[]>(
    () =>
      (data?.message ?? []).map((member) => ({
        employee: member.employee,
        name: member.employee_name,
        image: member.user_image,
        billable: member.billable_hours,
        nonBillable: member.non_billable_hours,
        expected: member.expected_hours,
        delta: member.delta,
        status: member.weekly_approval_status,
      })),
    [data],
  );

  if (isLoading) {
    return <TimesheetsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">Timesheets</h3>
        <Select
          className="w-fit shrink-0 bg-surface-gray-2 font-bold text-ink-gray-7"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(value) => setPeriod(value ?? LAST_WEEK_VALUE)}
        />
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-base text-ink-gray-5">
          No team timesheets.
        </p>
      ) : (
        <ListView
          columns={TIMESHEET_COLUMNS}
          rows={rows}
          rowKey="employee"
          options={{
            options: {
              selectable: false,
              showTooltip: false,
              resizeColumn: false,
            },
          }}
        >
          <ListHeader className="mb-0 gap-2 rounded-none border-b border-outline-gray-1 bg-transparent p-1">
            {TIMESHEET_COLUMNS.map((column) => (
              <ListHeaderItem key={column.key} item={column}>
                <span className="truncate text-sm text-ink-gray-5">
                  {column.label}
                </span>
              </ListHeaderItem>
            ))}
          </ListHeader>
          <ListRows>
            {rows.map((member) => (
              <ListRow key={member.employee} row={member}>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[0]}
                  row={member}
                  item={member.name}
                  prefix={
                    <Avatar
                      size="sm"
                      label={member.name}
                      image={member.image ?? undefined}
                    />
                  }
                >
                  <span className="truncate text-base font-medium text-ink-gray-7">
                    {member.name}
                  </span>
                </ListRowItem>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[1]}
                  row={member}
                  item={member.billable}
                  align="right"
                >
                  <span className="truncate text-base text-ink-gray-6">
                    {HOURS(member.billable)}
                  </span>
                </ListRowItem>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[2]}
                  row={member}
                  item={member.nonBillable}
                  align="right"
                >
                  <span className="truncate text-base text-ink-gray-6">
                    {HOURS(member.nonBillable)}
                  </span>
                </ListRowItem>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[3]}
                  row={member}
                  item={member.expected}
                  align="right"
                >
                  <span className="truncate text-base text-ink-gray-6">
                    {HOURS(member.expected)}
                  </span>
                </ListRowItem>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[4]}
                  row={member}
                  item={member.delta}
                  align="right"
                >
                  <span className="truncate text-base text-ink-gray-6">
                    {HOURS(member.delta)}
                  </span>
                </ListRowItem>
                <ListRowItem
                  column={TIMESHEET_COLUMNS[5]}
                  row={member}
                  item=""
                  align="right"
                >
                  <StatusIcon status={member.status} />
                </ListRowItem>
              </ListRow>
            ))}
          </ListRows>
        </ListView>
      )}
    </div>
  );
}
