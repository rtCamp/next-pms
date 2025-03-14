/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { prettyDate } from "@next-pms/design-system/date";
import { ResourceTableCell } from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass, getCellBackGroundColor } from "@next-pms/resource-management/utils";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { ResourceAllocationObjectProps, ResourceAllocationProps } from "@/types/resource_management";
import { EmptyTableCell } from "../../../components/empty";
import { ResourceAllocationList } from "../../../components/resource-allocation-list/resourceAllocationList";
import { ProjectContext } from "../../../store/projectContext";
import { ResourceFormContext } from "../../../store/resourceFormContext";
import type { AllocationDataProps, ProjectAllWeekDataProps, ProjectResourceProps } from "../../../store/types";
import { getIsBillableValue } from "../../../utils/helper";

/**
 * This component is responsible for loading the single cell of project view.
 *
 * @param props.projectSingleDay The project single day all resources data.
 * @param props.allWeekData The all week data for the project.
 * @param props.rowCount The row count. use to show the border of cell.
 * @param props.midIndex The mid index. use to find the values of combine week views.
 * @param props.projectAllocations The project allocations data.
 * @param props.project The project name/ID.
 * @param props.project_name The project name.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceProjectTableCell = ({
  projectSingleDay,
  allWeekData,
  rowCount,
  midIndex,
  projectAllocations,
  project,
  project_name,
  onSubmit,
}: {
  projectSingleDay: ProjectResourceProps;
  allWeekData: ProjectAllWeekDataProps[];
  rowCount: number;
  midIndex: number;
  project: string;
  project_name: string;
  projectAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { projectData, tableView, filters } = useContext(ProjectContext);

  const customer = projectData.customer;
  const allocationType = filters.allocationType;

  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (allWeekData[midIndex].total_allocated_hours == 0) {
        return -1;
      }
      return 100 - (allWeekData[midIndex].total_worked_hours / allWeekData[midIndex].total_allocated_hours) * 100;
    }

    if (projectSingleDay.total_allocated_hours == 0) {
      return -1;
    }

    return 100 - (projectSingleDay.total_worked_hours / projectSingleDay.total_allocated_hours) * 100;
  }, [
    allWeekData,
    midIndex,
    projectSingleDay.total_allocated_hours,
    projectSingleDay.total_worked_hours,
    tableView.combineWeekHours,
  ]);

  const cellBackGroundColor = useMemo(() => {
    if (allocationPercentage === -1 || tableView.view == "planned") {
      return "bg-transparent";
    }

    return getCellBackGroundColor(allocationPercentage);
  }, [allocationPercentage, tableView.view]);

  const cellValue = useMemo(() => {
    let allocated_hours = 0,
      worked_hours = 0;
    if (tableView.combineWeekHours) {
      if (!(rowCount == 2)) {
        return "";
      }

      allocated_hours = allWeekData[midIndex].total_allocated_hours;
      worked_hours = allWeekData[midIndex].total_worked_hours;
    } else {
      allocated_hours = projectSingleDay.total_allocated_hours;
      worked_hours = projectSingleDay.total_worked_hours;
    }

    if (tableView.view == "planned") {
      if (!allocated_hours) {
        return "-";
      }
      return allocated_hours;
    }

    if (!worked_hours && !allocated_hours) {
      return "-";
    }

    return `${worked_hours} / ${allocated_hours}`;
  }, [
    allWeekData,
    midIndex,
    projectSingleDay.total_allocated_hours,
    projectSingleDay.total_worked_hours,
    rowCount,
    tableView.combineWeekHours,
    tableView.view,
  ]);

  const onCellClick = () => {
    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee: "",
      employee_name: "",
      project: project,
      allocation_start_date: projectSingleDay.date,
      allocation_end_date: projectSingleDay.date,
      is_billable: getIsBillableValue(allocationType as string[]) != "0",
      customer: "",
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project_name: project_name,
      customer_name: "",
      name: "",
    });
  };

  const { date: dateStr, day } = prettyDate(projectSingleDay.date);
  const title = project_name + " (" + dateStr + " - " + day + ")";

  if (tableView.combineWeekHours) {
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(projectSingleDay.date)
        )}
        value={cellValue}
      />
    );
  }

  if (cellValue == "-") {
    return (
      <EmptyTableCell
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(projectSingleDay.date)
        )}
        value={""}
        onCellClick={onCellClick}
      />
    );
  }

  return (
    <ResourceTableCell
      type="hovercard"
      title={title}
      cellClassName={mergeClassNames(
        getTableCellClass(rowCount, midIndex),
        cellBackGroundColor,
        getTodayDateCellClass(projectSingleDay.date)
      )}
      value={cellValue}
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={
              projectSingleDay.project_resource_allocation_for_given_date as unknown as ResourceAllocationProps[]
            }
            employeeAllocations={projectAllocations}
            customer={customer}
            onButtonClick={onCellClick}
            viewType={"project"}
            onSubmit={onSubmit}
          />
        );
      }}
    />
  );
};

export { ResourceProjectTableCell };
