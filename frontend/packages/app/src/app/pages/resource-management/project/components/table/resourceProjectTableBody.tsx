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
import { emptyProjectDayData, ProjectContext } from "../../../store/projectContext";
import type { AllocationDataProps, DateProps, ProjectDataProps } from "../../../store/types";
import { getIsBillableValue } from "../../../utils/helper";
import { ResourceExpandView } from "../expand-view";
import { ResourceProjectTableCell } from "./resourceProjectTableCell";

/**
 * This function is responsible for rendering the table body for project view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceProjectTableBody = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { projectData, filters } = useContext(ProjectContext);

  const data = projectData.data;
  const dates = projectData.dates;
  const allocationType = filters.allocationType;

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
                  {dates.map((week: DateProps, week_index: number) => {
                    return week.dates.map((date: string, index: number) => {
                      let projectSingleDay = emptyProjectDayData;

                      if (date in projectData.all_dates_data) {
                        projectSingleDay = projectData.all_dates_data[date];
                      } else {
                        projectSingleDay = {
                          ...emptyProjectDayData,
                          date: date,
                        };
                      }

                      return (
                        <ResourceProjectTableCell
                          key={`${projectSingleDay.total_allocated_hours}-id-${Math.random()}`}
                          projectSingleDay={projectSingleDay}
                          allWeekData={projectData.all_week_data}
                          rowCount={index}
                          midIndex={week_index}
                          projectAllocations={projectData.project_allocations}
                          project={projectData.name}
                          project_name={projectData.project_name}
                          onSubmit={onSubmit}
                        />
                      );
                    });
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return (
                <ResourceExpandView
                  project={projectData.name}
                  project_name={projectData.project_name}
                  start_date={dates[0].start_date}
                  end_date={dates[dates.length - 1].end_date}
                  is_billable={getIsBillableValue(allocationType as string[])}
                  onSubmit={onSubmit}
                />
              );
            }}
          />
        );
      })}
    </TableBody>
  );
};

export { ResourceProjectTableBody };
