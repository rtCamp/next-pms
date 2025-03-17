/**
 * External dependencies.
 */
import { useContext } from "react";
import { TableBody } from "@next-pms/design-system/components";
import { ResourceTableRow } from "@next-pms/resource-management/components";

/**
 * Internal dependencies.
 */
import { EmptyTableBody } from "../../../components/empty";
import { defaultEmployeeDayData, TeamContext } from "../../../store/teamContext";
import type { AllocationDataProps, DateProps, EmployeeDataProps } from "../../../store/types";
import { ResourceExpandView } from "../expand-view";
import { ResourceTeamTableCell } from "./resourceTeamTableCell";

/**
 * This function is responsible for rendering the table body for table view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTableBody = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { teamData } = useContext(TeamContext);

  const data = teamData.data;
  const dates = teamData.dates;

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((employeeData: EmployeeDataProps) => {
        return (
          <ResourceTableRow
            key={employeeData.name}
            name={employeeData.name}
            avatar={employeeData.image}
            avatar_abbr={employeeData.employee_name}
            avatar_name={employeeData.employee_name}
            RowComponent={() => {
              return (
                <>
                  {dates.map((week: DateProps, week_index: number) => {
                    return week.dates.map((date: string, index: number) => {
                      let employeeSingleDay = defaultEmployeeDayData;

                      if (date in employeeData.all_dates_data) {
                        employeeSingleDay = employeeData.all_dates_data[date];
                      } else {
                        employeeSingleDay = {
                          ...employeeSingleDay,
                          date: date,
                          total_working_hours: employeeData.employee_daily_working_hours,
                        };
                      }

                      let weekData = {
                        total_allocated_hours: 0,
                        total_working_hours: employeeData.employee_daily_working_hours * 5,
                        total_worked_hours: 0,
                      };

                      if (week.key in employeeData.all_week_data) {
                        weekData = employeeData.all_week_data[week.key];
                      }

                      return (
                        <ResourceTeamTableCell
                          key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                          employeeSingleDay={employeeSingleDay}
                          weekData={weekData}
                          employee={employeeData.name}
                          employee_name={employeeData.employee_name}
                          rowCount={index}
                          midIndex={week_index}
                          employeeAllocations={employeeData.employee_allocations}
                          onSubmit={onSubmit}
                        />
                      );
                    });
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return <ResourceExpandView employeeData={employeeData} onSubmit={onSubmit} />;
            }}
          />
        );
      })}
    </TableBody>
  );
};

export { ResourceTeamTableBody };
