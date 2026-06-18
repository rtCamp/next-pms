/**
 * External dependencies.
 */
import { useState } from "react";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRowItem,
  ListRows,
  ListView,
  Select,
} from "@rtcamp/frappe-ui-react";
import { Folder } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import {
  ALL_CUSTOMERS_VALUE,
  ASSIGNED_PROJECTS,
  ASSIGNED_PROJECTS_COLUMNS,
  CUSTOMER_OPTIONS,
} from "./constants";
import { HoursBurnBar } from "./hoursBurnBar";

export type AssignedProject = {
  name: string;
  customer: string;
  remaining: number;
  used: number;
  total: number;
  billableLastWeek: number;
  nonBillableLastWeek: number;
};

const HOURS = (value: number) => `${value}h`;

export function AssignedProjectsCard() {
  const [customer, setCustomer] = useState<string>(ALL_CUSTOMERS_VALUE);
  const rows =
    customer === ALL_CUSTOMERS_VALUE
      ? ASSIGNED_PROJECTS
      : ASSIGNED_PROJECTS.filter((project) => project.customer === customer);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Assigned projects
        </h3>
        <Select
          className="w-fit shrink-0 bg-surface-gray-2 font-bold text-ink-gray-7"
          options={CUSTOMER_OPTIONS}
          value={customer}
          onChange={(value) => setCustomer(value ?? ALL_CUSTOMERS_VALUE)}
        />
      </div>
      <ListView
        columns={ASSIGNED_PROJECTS_COLUMNS}
        rows={rows}
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
          {ASSIGNED_PROJECTS_COLUMNS.map((column) => (
            <ListHeaderItem key={column.key} item={column}>
              <span className="truncate text-sm text-ink-gray-5">
                {column.label}
              </span>
            </ListHeaderItem>
          ))}
        </ListHeader>
        <ListRows>
          {rows.map((row) => (
            <ListRow key={row.name} row={row}>
              <ListRowItem
                column={ASSIGNED_PROJECTS_COLUMNS[0]}
                row={row}
                item={row.name}
                prefix={<Folder className="size-4 shrink-0 text-ink-gray-5" />}
              >
                <span className="truncate text-base font-medium text-ink-gray-7">
                  {row.name}
                </span>
              </ListRowItem>
              <ListRowItem
                column={ASSIGNED_PROJECTS_COLUMNS[1]}
                row={row}
                item={row.remaining}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {HOURS(row.remaining)}
                </span>
              </ListRowItem>
              <ListRowItem
                column={ASSIGNED_PROJECTS_COLUMNS[2]}
                row={row}
                item=""
                align="center"
              >
                <HoursBurnBar used={row.used} total={row.total} />
              </ListRowItem>
              <ListRowItem
                column={ASSIGNED_PROJECTS_COLUMNS[3]}
                row={row}
                item={row.billableLastWeek}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {HOURS(row.billableLastWeek)}
                </span>
              </ListRowItem>
              <ListRowItem
                column={ASSIGNED_PROJECTS_COLUMNS[4]}
                row={row}
                item={row.nonBillableLastWeek}
                align="right"
              >
                <span className="truncate text-base text-ink-gray-6">
                  {HOURS(row.nonBillableLastWeek)}
                </span>
              </ListRowItem>
            </ListRow>
          ))}
        </ListRows>
      </ListView>
    </div>
  );
}
