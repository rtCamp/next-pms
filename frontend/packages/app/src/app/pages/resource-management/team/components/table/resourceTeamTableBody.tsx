/**
 * External dependencies.
 */
import { memo, useCallback, useMemo } from "react";
import { TableBody } from "@next-pms/design-system/components";
import { ResourceTableRow } from "@next-pms/resource-management/components";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { EmptyTableBody } from "../../../components/empty";
import {
  defaultEmployeeDayData,
  TeamContext,
} from "../../../store/teamContext";
import type {
  AllocationDataProps,
  DateProps,
  EmployeeDataProps,
} from "../../../store/types";
import { ResourceExpandView } from "../expand-view";
import { ResourceTeamTableCell } from "./resourceTeamTableCell";
import { RowCellComponentProps } from "../types";

/**
 * This function is responsible for rendering the table body for team view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTableBody = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const teamData = useContextSelector(
    TeamContext,
    (value) => value.state.teamData,
  );

  const data = teamData.data;
  const dates = teamData.dates;

  if (data.length === 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((employeeData) => (
        <MemoizedRow
          key={employeeData.employee_name}
          employeeData={employeeData}
          dates={dates}
          onSubmit={onSubmit}
        />
      ))}
    </TableBody>
  );
};

/**
 * This component is responsible for rendering a memoized table row
 *
 * @param props.employeeData The data of the employee for the row.
 * @param props.dates The date structure used to render day cells.
 * @param props.onSubmit The submit handler for each editable cell.
 * @returns React.FC
 */
const MemoizedRow = memo(function MemoizedRow({
  employeeData,
  dates,
  onSubmit,
}: {
  employeeData: EmployeeDataProps;
  dates: DateProps[];
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) {
  /**
   * Memoized component to render the entire row of cells for a single employee.
   */
  const RowComponent = () => {
    return (
      <>
        {dates.map((week: DateProps, week_index: number) => {
          return week.dates.map((date: string, index: number) => {
            return (
              <RowCellComponet
                key={`${week_index}-${employeeData?.name}-${index}-${date}`}
                date={date}
                employee={employeeData?.name}
                employee_name={employeeData?.employee_name}
                employeeAllocations={employeeData?.employee_allocations}
                midIndex={week_index}
                rowCount={index}
                dateData={employeeData?.all_dates_data[date]}
                weekData={employeeData?.all_week_data[week.key]}
                onSubmit={onSubmit}
              />
            );
          });
        })}
      </>
    );
  };

  const RowCellComponet = ({
    key,
    date,
    rowCount,
    midIndex,
    dateData,
    weekData,
    employee,
    employee_name,
    employeeAllocations,
    onSubmit,
  }: RowCellComponentProps) => {
    const { employeeWeekData, employeeSingleDay } = useMemo(() => {
      let employeeSingleDay = defaultEmployeeDayData;

      if (dateData) {
        employeeSingleDay = dateData;
      } else {
        employeeSingleDay = {
          ...employeeSingleDay,
          date,
          total_working_hours: employeeData.employee_daily_working_hours,
        };
      }

      let employeeWeekData = {
        total_allocated_hours: 0,
        total_working_hours: employeeData.employee_daily_working_hours * 5,
        total_worked_hours: 0,
      };

      if (weekData) {
        employeeWeekData = weekData;
      }

      return { employeeWeekData, employeeSingleDay };
    }, [date, dateData, weekData]);

    return (
      <ResourceTeamTableCell
        key={key}
        employeeSingleDay={employeeSingleDay}
        weekData={employeeWeekData}
        employee={employee}
        employee_name={employee_name}
        rowCount={rowCount}
        midIndex={midIndex}
        employeeAllocations={employeeAllocations}
        onSubmit={onSubmit}
      />
    );
  };

  const RowExpandView = useCallback(() => {
    return (
      <ResourceExpandView employeeData={employeeData} onSubmit={onSubmit} />
    );
  }, [employeeData, onSubmit]);

  return (
    <ResourceTableRow
      key={employeeData?.name}
      name={employeeData?.name}
      avatar={employeeData?.image}
      avatar_abbr={employeeData?.employee_name}
      avatar_name={employeeData?.employee_name}
      RowComponent={RowComponent}
      RowExpandView={RowExpandView}
    />
  );
});

export { ResourceTeamTableBody };
