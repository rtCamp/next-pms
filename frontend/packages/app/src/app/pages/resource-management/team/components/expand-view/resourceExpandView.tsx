/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { Table, TableBody, TableRow } from "@next-pms/design-system/components";
import { TableDisabledRow, TableInformationCellContent } from "@next-pms/resource-management/components";

/**
 * Internal dependencies.
 */
import { ExpandViewCell } from "./expandViewCell";
import { EmptyRow } from "../../../components/empty";
import { TeamContext } from "../../../store/teamContext";
import type { AllocationDataProps, DateProps, EmployeeDataProps } from "../../../store/types";
import { CombinedResourceDataProps, CombinedResourceObjectProps, groupAllocations } from "../../../utils/group";

/**
 * This component is responsible for loading Team view expand view data.
 *
 * @param props.employeeData React.FC
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
export const ResourceExpandView = ({
  employeeData,
  onSubmit,
}: {
  employeeData: EmployeeDataProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { teamData } = useContext(TeamContext);
  const dates = teamData.dates;

  const employeeResourceData: { combinedResourceData: CombinedResourceObjectProps; allDates: string[] } = useMemo(
    findCombineData,
    [dates, employeeData.all_dates_data, employeeData.employee_allocations]
  );

  function findCombineData() {
    return groupAllocations(employeeData.all_dates_data, employeeData.employee_allocations, dates);
  }
  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {Object.keys(employeeResourceData["combinedResourceData"]).length == 0 &&
          Object.keys(employeeData.all_leave_data).length == 0 && <EmptyRow dates={employeeResourceData.allDates} />}
        {Object.entries(employeeResourceData["combinedResourceData"]).length > 0 &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //   @ts-ignore
          Object.entries(employeeResourceData["combinedResourceData"]).map(
            ([item, itemData]: [string, CombinedResourceDataProps]) => {
              return (
                <TableRow key={item} className="flex items-center w-full border-0">
                  <TableInformationCellContent
                    cellClassName="pl-12"
                    onClick={() => {
                      window.location.href = `${window.location.origin}/app/project/${item}`;
                    }}
                    value={!item ? "No Project" : `${itemData.project_name}`}
                  />
                  {dates.map((datesList: DateProps, weekIndex: number) => {
                    return datesList?.dates?.map((date: string, index: number) => {
                      return (
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
                      );
                    });
                  })}
                </TableRow>
              );
            }
          )}

        {Object.keys(employeeData.all_leave_data).length != 0 && (
          <TableDisabledRow dates={employeeResourceData.allDates} data={employeeData.all_leave_data} />
        )}
      </TableBody>
    </Table>
  );
};
