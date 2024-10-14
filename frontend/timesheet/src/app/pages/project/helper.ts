import { ProjectData, ProjectState } from "@/store/project";
import { ColumnDef, Row } from "@tanstack/react-table";

export const colOrder: string[] = [
  "name",
  "project_name",
  "project_type",
  "custom_business_unit",
  "status",
  "priority",
  "customer",
  "company",
  "custom_billing_type",
  "custom_currency",
  "estimated_costing",
  "custom_percentage_estimated_cost",
  "percent_complete_method",
  "actual_start_date",
  "actual_end_date",
  "actual_time",
  "total_sales_amount",
  "total_billable_amount",
  "total_billed_amount",
  "total_costing_amount",
  "total_expense_claim",
  "custom_total_hours_purchased",
  "custom_total_hours_remaining",
  "gross_margin",
  "per_gross_margin",
];
export const projectTableMap = {
  hideColumn: [],
  columnOrder: colOrder,
  columnWidth: {
    project_name: 300,
    customer: 250,
    project_type: 250,
    custom_business_unit: 150,
    priority: 200,
    company: 300,
    custom_billing_type: 200,
    custom_currency: 100,
    estimated_costing: 200,
    percent_complete_method: 200,
    actual_start_date: 250,
    actual_end_date: 250,
    actual_time: 150,
    total_sales_amount: 250,
    total_billable_amount: 250,
    total_billed_amount: 250,
    total_costing_amount: 250,
    total_expense_claim: 250,
    custom_total_hours_purchased: 250,
    custom_total_hours_remaining: 250,
    custom_percentage_estimated_cost: 250,
    gross_margin: 150,
    per_gross_margin: 150,
    status: 150,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
