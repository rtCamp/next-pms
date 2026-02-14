/**
 * External dependencies.
 */
import { useMemo, useCallback, memo } from "react";
import { Table, TableBody, TableRow } from "@next-pms/design-system/components";
import {
  TableDisabledRow,
  TableInformationCellContent,
} from "@next-pms/resource-management/components";
import { useContextSelector } from "use-context-selector";
/**
 * Internal dependencies.
 */
import { ExpandViewCell } from "./expandViewCell";
import { EmptyRow } from "../../../components/empty";
import { TeamContext } from "../../../store/teamContext";
import type {
  AllocationDataProps,
  DateProps,
  EmployeeDataProps,
} from "../../../store/types";
import {
  CombinedResourceDataProps,
  CombinedResourceObjectProps,
  groupAllocations,
} from "../../../utils/group";

/**
 * This component is responsible for loading Team view expand view data.
 *
 * @param props.employeeData React.FC
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const findCombineData = (
  all_dates_data: EmployeeDataProps["all_dates_data"],
  employee_allocations: EmployeeDataProps["employee_allocations"],
  dates: DateProps[],
) => {
  return groupAllocations(all_dates_data, employee_allocations, dates);
};

export const ResourceExpandView = memo(
  ({
    employeeData,
    onSubmit,
  }: {
    employeeData: EmployeeDataProps;
    onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  }) => {
    const teamData = useContextSelector(
      TeamContext,
      (value) => value.state.teamData,
    );
    const dates = teamData.dates;

    const employeeResourceData: {
      combinedResourceData: CombinedResourceObjectProps;
      allDates: string[];
    } = useMemo(
      () =>
        findCombineData(
          employeeData?.all_dates_data,
          employeeData.employee_allocations,
          dates,
        ),
      [dates, employeeData?.all_dates_data, employeeData.employee_allocations],
    );

    const onProjectClick = useCallback((projectId: string) => {
      window.location.href = `${window.location.origin}/app/project/${projectId}`;
    }, []);

    const renderedRows = useMemo(() => {
      return Object.entries(employeeResourceData["combinedResourceData"]).map(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ([item, itemData]: [string, CombinedResourceDataProps]) => (
          <TableRow key={item} className="flex items-center w-full border-0">
            <TableInformationCellContent
              cellClassName="pl-12"
              onClick={() => onProjectClick(item)}
              value={!item ? "No Project" : `${itemData.project_name}`}
            />
            {dates.map((datesList: DateProps, weekIndex: number) =>
              datesList?.dates?.map((date: string, index: number) => (
                <ExpandViewCell
                  key={date + "-" + index}
                  index={index}
                  allocationsData={itemData.all_allocation[date]}
                  date={date}
                  employee={employeeData.name}
                  employee_name={employeeData.employee_name}
                  project={item}
                  project_name={itemData.project_name}
                  customer_name={itemData.customer_name || ""}
                  weekIndex={weekIndex}
                  onSubmit={onSubmit}
                />
              )),
            )}
          </TableRow>
        ),
      );
    }, [
      employeeResourceData.combinedResourceData,
      dates,
      employeeData,
      onProjectClick,
      onSubmit,
    ]);

    return (
      <Table>
        <TableBody className="[&_tr]:pr-0">
          {Object.keys(employeeResourceData.combinedResourceData).length ===
            0 &&
            Object.keys(employeeData.all_leave_data).length === 0 && (
              <EmptyRow dates={employeeResourceData.allDates} />
            )}
          {renderedRows}
          {Object.keys(employeeData.all_leave_data).length !== 0 && (
            <TableDisabledRow
              dates={employeeResourceData.allDates}
              data={employeeData.all_leave_data}
            />
          )}
        </TableBody>
      </Table>
    );
  },
);
