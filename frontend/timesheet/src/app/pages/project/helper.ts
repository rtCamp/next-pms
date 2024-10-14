import { ProjectData, ProjectState } from "@/store/project";
import { Row } from "@tanstack/react-table";

export const projectTableMap = {
  hideColumn: [],
  columnWidth: {
    project_name: 280,
    status: 200,
    project_type: 200,
    percent_complete: 200,
    custom_total_hours_purchased: 180,
    actual_time: 280,
    custom_total_hours_remaining: 180,
  },
  columnSort: [],
};
export const calculatePercentage = (spent: number, budget: number) => {
  return budget == 0 ? 0 : Math.round((spent / budget) * 100);
};
export const getTableProps = () => {
  try {
    const data = JSON.parse(String(localStorage.getItem("project")));
    if (!data) {
      return projectTableMap;
    } else {
      return data;
    }
  } catch (error) {
    return projectTableMap;
  }
};
export const sortPercentageComplete = (
  rowA: Row<ProjectData>,
  rowB: Row<ProjectData>,
  columnId: string,
) => {
  const firstRowPer = calculatePercentage(
    Number(rowA.getValue("actual_time")),
    Number(rowA.getValue("custom_total_hours_purchased")),
  );
  const secondRowPer = calculatePercentage(
    Number(rowB.getValue("actual_time")),
    Number(rowB.getValue("custom_total_hours_purchased")),
  );
  if (firstRowPer > secondRowPer) {
    return 1;
  } else if (firstRowPer < secondRowPer) {
    return -1;
  } else {
    return 0;
  }
};

export const getFilter = (projectState: ProjectState) => {
  const filters = [];

  if (projectState.search) {
    filters.push(["project_name", "like", `%${projectState.search}%`]);
  }
  if (projectState.selectedProjectType.length > 0) {
    filters.push(["project_type", "in", projectState.selectedProjectType]);
  }
  if (projectState.selectedStatus.length > 0) {
    filters.push(["status", "in", projectState.selectedStatus]);
  }

  return filters;
};

export const currencyFormat = (currency: string) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  });
};
