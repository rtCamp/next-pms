/**
 * External dependencies.
 */
import { Avatar, AvatarFallback, AvatarImage, Table, TableBody, TableRow } from "@next-pms/design-system/components";
import { TableInformationCellContent } from "@next-pms/resource-management/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { ResourceAllocationObjectProps } from "@/types/resource_management";
import { ProjectContext } from "../../../store/projectContext";
import type { DateProps, EmployeeDataProps, EmployeeResourceProps } from "../../../store/types";
import type { ResourceExpandViewProps } from "../types";
import { ExpandViewCell } from "./expandViewCell";

/**
 * This component is responsible for loading expand view of resource allocation project view. shows the employee wise allocation data.
 *
 * @param props.project The project name/ID.
 * @param props.project_name The name of the project
 * @param props.start_date The start date from which data need to show.
 * @param props.end_date The end date till whihc data need to show.
 * @param props.is_billable The is billable flag.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
export const ResourceExpandView = ({
  project,
  project_name,
  start_date,
  end_date,
  is_billable,
  onSubmit,
}: ResourceExpandViewProps) => {
  const projectData = useContextSelector(ProjectContext, (value) => value.state.projectData);

  const dates = projectData.dates;

  const { data } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_employees_resrouce_data_for_given_project",
    {
      project: project,
      start_date: start_date,
      end_date: end_date,
      is_billable: is_billable,
    },
    undefined
  );

  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {data &&
          data.message.data.map((employeeData: EmployeeDataProps & { allocations: ResourceAllocationObjectProps }) => {
            return (
              <TableRow key={employeeData.name} className="flex items-center w-full border-0">
                <TableInformationCellContent
                  cellClassName="overflow-hidden flex items-center pl-10 font-normal hover:underline"
                  CellComponet={() => {
                    return (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={decodeURIComponent(employeeData?.image)} />
                        <AvatarFallback>{employeeData?.employee_name}</AvatarFallback>
                      </Avatar>
                    );
                  }}
                  value={employeeData?.employee_name}
                />

                {dates.map((item: DateProps, weekIndex: number) => {
                  return item?.dates?.map((date, index: number) => {
                    let employeeSingleDayData: EmployeeResourceProps = {
                      date: "",
                      total_allocated_hours: 0,
                      total_worked_hours: 0,
                      employee_resource_allocation_for_given_date: [],
                      total_working_hours: 0,
                      is_on_leave: false,
                      total_leave_hours: 0,
                      total_allocation_count: 0,
                    };

                    if (date in employeeData.all_dates_data) {
                      employeeSingleDayData = employeeData.all_dates_data[date];
                    } else {
                      employeeSingleDayData = {
                        ...employeeSingleDayData,
                        date: date,
                      };
                    }
                    return (
                      <ExpandViewCell
                        key={employeeSingleDayData.date + "-" + index}
                        index={index}
                        weekIndex={weekIndex}
                        allocationsData={employeeSingleDayData}
                        employeeAllocations={employeeData.allocations}
                        customer={data.message.customer}
                        employee={employeeData.name}
                        employee_name={employeeData.employee_name}
                        project={project}
                        project_name={project_name}
                        onSubmit={onSubmit}
                      />
                    );
                  });
                })}
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
};
