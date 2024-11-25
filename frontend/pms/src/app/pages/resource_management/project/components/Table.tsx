import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { DateProps } from "@/store/resource_management/team";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { getTableCellClass } from "../../utils/helper";
import { ResourceAllocationObjectProps } from "@/types/resource_management";
import ResourceProjectTableHeader from "../../components/TableHeader";
import { EmptyTableBody } from "../../components/Empty";
import { ResourceTableRow } from "../../components/TableRow";
import { ProjectDataProps, ProjectResourceProps } from "@/store/resource_management/project";
import { useMemo } from "react";

const ResourceProjectTable = () => {
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_project.data.dates);

  return (
    <Table className="lg:[&_tr]:pr-3 relative">
      <ResourceProjectTableHeader dates={dates} />
      <ResourceProjectTableBody />
    </Table>
  );
};

const ResourceProjectTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_project.data.data);

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((projectData: ProjectDataProps) => {
        return (
          <ResourceTableRow
            name={projectData.name}
            avatar={projectData.image}
            avatar_abbr={projectData.project_name}
            avatar_name={projectData.project_name}
            RowComponent={() => {
              return (
                <>
                  {projectData.all_dates_data.map((projectSingleDay: ProjectResourceProps, index: number) => {
                    return (
                      <ResourceProjectTableCell
                        key={`${projectSingleDay.total_allocated_hours}-id-${Math.random()}`}
                        projectSingleDay={projectSingleDay}
                        allWeekData={projectData.all_week_data}
                        rowCount={index}
                        midIndex={index <= 4 ? 0 : 1}
                        projectAllocations={projectData.employee_allocations}
                      />
                    );
                  })}
                </>
              );
            }}
          />
        );
      })}
    </TableBody>
  );
};

const ResourceProjectTableCell = ({
  projectSingleDay,
  allWeekData,
  rowCount,
  midIndex,
  projectAllocations,
}: {
  projectSingleDay: ProjectResourceProps;
  allWeekData: any;
  rowCount: number;
  midIndex: number;
  projectAllocations: ResourceAllocationObjectProps;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_project.tableView);

  let allocationPercentage = useMemo(() => {
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

    if (allocationPercentage == 100) {
      return "bg-destructive/30";
    }

    if (allocationPercentage <= 10) {
      return "bg-success/20";
    }

    if (allocationPercentage <= 20) {
      return "bg-customYellow";
    }

    return "bg-destructive/10";
  }, [allocationPercentage, tableView.view]);

  const cellValue = useMemo(() => {
    let allocated_hours = 0,
      worked_hours = 0;
    if (tableView.combineWeekHours) {
      if (!(rowCount == 2 || rowCount == 7)) {
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

  return (
    <TableCell className={cn(getTableCellClass(rowCount), cellBackGroundColor)}>
      <Typography className={cn("text-gray-800 text-xs h-6 flex items-center")} variant="p">
        {cellValue}
      </Typography>
    </TableCell>
  );
};

export { ResourceProjectTable };
