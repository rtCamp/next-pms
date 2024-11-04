import { ProjectData, ProjectState } from "@/store/project";
import { Row } from "@tanstack/react-table";

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
  "percent_complete"
];

export const columnMap = {
  project_name: "Project Name",
  project_type: "Project Type",
  custom_business_unit: "Business Unit",
  status: "Status",
  priority: "Priority",
  customer: "Customer",
  company: "Company",
  custom_billing_type: "Billing Type",
  custom_currency: "Currency",
  estimated_costing: "Estimated Cost",
  custom_percentage_estimated_cost: "%Estimated Cost",
  percent_complete_method: "Completion Method",
  actual_start_date: "Start Date (via Timesheet)",
  actual_end_date: "End Date (via Timesheet)",
  actual_time: "Budget Spent (Hours)",
  total_sales_amount: "Total Sales Amount",
  total_billable_amount: "Total Billable Amount",
  total_billed_amount: "Total Billed Amount",
  total_costing_amount: "Total Costing Amount",
  total_expense_claim: "Total Expense Claim",
  custom_total_hours_purchased: "Total Hours Purchased",
  custom_total_hours_remaining: "Total Hours Remaining",
  gross_margin: "Gross Margin",
  per_gross_margin: "%Gross Margin",

};

export const projectTableMap = {
  hideColumn: [],
  columnOrder: colOrder,
  columnWidth: {
    project_name: 200,
    customer: 200,
    project_type: 150,
    custom_business_unit: 150,
    priority: 100,
    company: 200,
    custom_billing_type: 200,
    custom_currency: 100,
    estimated_costing: 100,
    percent_complete_method: 200,
    actual_start_date: 150,
    actual_end_date: 150,
    actual_time: 150,
    total_sales_amount: 150,
    total_billable_amount: 150,
    total_billed_amount: 150,
    total_costing_amount: 150,
    total_expense_claim: 150,
    custom_total_hours_purchased: 150,
    custom_total_hours_remaining: 150,
    custom_percentage_estimated_cost: 150,
    gross_margin: 150,
    per_gross_margin: 100,
    status: 100,
    percent_complete: 100
  },
  order: "desc",
  orderColumn: "project_name",
};
export const calculatePercentage = (spent: number, budget: number) => {
  return budget == 0 ? 0 : Math.round((spent / budget) * 100);
};
export const getTableProps = (type: string | undefined) => {
  const key = `__listview::project:${type ? type : "all"}`;
  try {
    const data = JSON.parse(String(localStorage.getItem(key)));
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
  if (projectState.selectedBusinessUnit.length > 0) {
    filters.push(["custom_business_unit", "in", projectState.selectedBusinessUnit]);
  }

  return filters;
};

export const getFieldInfo = (type: string | undefined) => {
  if (!type) {
    return colOrder;
  }
  if (type == "fixed-cost" || type == "retainer") {
    return [
      "name",
      "project_name",
      "custom_business_unit",
      "status",
      "custom_billing_type",
      "custom_currency",
      "estimated_costing",
      "percent_complete",
      "actual_time",
      "total_sales_amount",
      "total_billed_amount",
      "total_costing_amount",
      "total_expense_claim",
      "custom_total_hours_purchased",
      "custom_total_hours_remaining",
      "custom_percentage_estimated_cost",
      "gross_margin",
      "per_gross_margin",
    ];
  } else if (type == "tnm") {
    return [
      "name",
      "project_name",
      "custom_business_unit",
      "status",
      "custom_billing_type",
      "custom_currency",
      "estimated_costing",
      "percent_complete",
      "actual_time",
      "total_sales_amount",
      "total_billed_amount",
      "total_costing_amount",
      "total_expense_claim",
      "custom_percentage_estimated_cost",
      "gross_margin",
      "per_gross_margin",
    ];
  } else {
    return colOrder;
  }
}
export const currencyFormat = (currency: string) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  });
};
