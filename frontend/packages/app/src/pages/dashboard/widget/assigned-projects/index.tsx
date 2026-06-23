/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRowItem,
  ListRows,
  ListView,
  MultiSelect,
} from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";
import { Folder } from "@rtcamp/frappe-ui-react/icons";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ASSIGNED_PROJECTS_COLUMNS } from "./constants";
import { HoursBurnBar } from "./hours-burn";
import { AssignedProjectsSkeleton } from "./skeleton";
import type { AssignedProject, ProjectSummaryResponse } from "./types";

const HOURS = (value: number) => `${value}h`;

export default function AssignedProjects() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const { data, isLoading } = useFrappeGetCall<ProjectSummaryResponse>(
    "next_pms.api.dashboard.get_my_projects_summary",
    { days: 7 },
  );

  const projects = useMemo<AssignedProject[]>(
    () =>
      (data?.message ?? []).map((project) => ({
        name: project.name,
        projectName: project.project_name,
        customer: project.customer,
        remaining: project.total_hours_remaining,
        used: project.actual_time,
        total: project.total_hours_purchased,
        billableLastWeek: project.billable_hours,
        nonBillableLastWeek: project.non_billable_hours,
      })),
    [data],
  );

  const customerOptions = useMemo<MultiSelectOption[]>(
    () =>
      Array.from(new Set(projects.map((p) => p.customer).filter(Boolean))).map(
        (value) => ({ value, label: value }),
      ),
    [projects],
  );

  const allCustomersSelected =
    selectedCustomers.length === 0 ||
    selectedCustomers.length === customerOptions.length;

  const rows = allCustomersSelected
    ? projects
    : projects.filter((project) =>
        selectedCustomers.includes(project.customer),
      );

  if (isLoading) {
    return <AssignedProjectsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Assigned projects
        </h3>
        <div className="w-44 shrink-0">
          <MultiSelect
            options={customerOptions}
            value={selectedCustomers}
            triggerLabel={
              allCustomersSelected
                ? "All customers"
                : `${selectedCustomers.length} customer${selectedCustomers.length === 1 ? "" : "s"} selected`
            }
            onChange={setSelectedCustomers}
          />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-base text-ink-gray-5">
          No assigned projects.
        </p>
      ) : (
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
                  item={row.projectName}
                  prefix={
                    <Folder className="size-4 shrink-0 text-ink-gray-5" />
                  }
                >
                  <span className="truncate text-base font-medium text-ink-gray-7">
                    {row.projectName}
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
      )}
    </div>
  );
}
