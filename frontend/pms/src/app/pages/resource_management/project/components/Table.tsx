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
import { ResourceExpandView } from "./ExpandView";
import { ResourceTableCell } from "../../components/TableCell";
import { getCellBackGroundColor } from "../../utils/cell";

const ResourceProjectTable = () => {
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_project.data.dates);

  return (
    <Table className="lg:[&_tr]:pr-3 relative">
      <ResourceProjectTableHeader dates={dates} title="Projects" />
      <ResourceProjectTableBody />
    </Table>
  );
};

const ResourceProjectTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_project.data.data);
  const dates = useSelector((state: RootState) => state.resource_project.data.dates);

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((projectData: ProjectDataProps) => {
        if (!projectData.project_name) {
          return <></>;
        }
        return (
          <ResourceTableRow
            name={projectData.name}
            avatar={projectData.image}
            avatar_abbr={projectData.project_name[0]}
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
                        midIndex={projectSingleDay.week_index}
                        projectAllocations={projectData.employee_allocations}
                      />
                    );
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return (
                <ResourceExpandView
                  project={projectData.name}
                  start_date={dates[0].start_date}
                  end_date={dates[dates.length - 1].end_date}
                />
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
      if (!(rowCount == 5 * (midIndex + 1) - 3)) {
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
    <ResourceTableCell
      type="default"
      title={""}
      cellClassName={cn(getTableCellClass(rowCount), cellBackGroundColor)}
      value={cellValue}
    />
  );
};

export { ResourceProjectTable };
