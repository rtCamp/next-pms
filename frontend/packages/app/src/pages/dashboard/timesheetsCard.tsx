/**
 * External dependencies.
 */
import { useState } from "react";
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

/**
 * Internal dependencies.
 */
import {
  LAST_WEEK_VALUE,
  PERIOD_OPTIONS,
  TIMESHEET_COLUMNS,
  TIMESHEET_MEMBERS,
} from "./constants";
import { DeltaStatusIcon, type TimesheetStatus } from "./deltaStatusIcon";

export type TimesheetMember = {
  name: string;
  billable: number;
  nonBillable: number;
  expected: number;
  delta: number;
  status: TimesheetStatus;
};

export function TimesheetsCard() {
  const [period, setPeriod] = useState<string>(LAST_WEEK_VALUE);

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
      <ListView
        columns={TIMESHEET_COLUMNS}
        rows={TIMESHEET_MEMBERS}
        rowKey="name"
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
          {TIMESHEET_MEMBERS.map((member) => (
            <ListRow key={member.name} row={member}>
              <ListRowItem
                column={TIMESHEET_COLUMNS[0]}
                row={member}
                item={member.name}
                prefix={<Avatar size="sm" label={member.name} />}
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
                  {member.billable}
                </span>
              </ListRowItem>
              <ListRowItem
                column={TIMESHEET_COLUMNS[2]}
                row={member}
                item={member.nonBillable}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {member.nonBillable}
                </span>
              </ListRowItem>
              <ListRowItem
                column={TIMESHEET_COLUMNS[3]}
                row={member}
                item={member.expected}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {member.expected}
                </span>
              </ListRowItem>
              <ListRowItem
                column={TIMESHEET_COLUMNS[4]}
                row={member}
                item={member.delta}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {member.delta}
                </span>
              </ListRowItem>
              <ListRowItem
                column={TIMESHEET_COLUMNS[5]}
                row={member}
                item=""
                align="right"
              >
                <DeltaStatusIcon status={member.status} />
              </ListRowItem>
            </ListRow>
          ))}
        </ListRows>
      </ListView>
    </div>
  );
}
