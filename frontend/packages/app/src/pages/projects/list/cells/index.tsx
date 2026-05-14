/**
 * Internal dependencies.
 */
import { toKebabCase } from "@/lib/utils";
import { BudgetProgressCell } from "./budgetProgressCell";
import { DateCell } from "./dateCell";
import { EmployeeCell } from "./employeeCell";
import { PhaseCell } from "./phaseCell";
import { ProjectNameCell } from "./projectNameCell";
import type { ListViewColumn, ProjectListItem } from "../types";
import { TextCell } from "./textCell";

export function ProjectListCell({
  row,
  column,
}: {
  row: ProjectListItem;
  column: ListViewColumn;
}) {
  switch (column.key) {
    case "name":
      return (
        <ProjectNameCell
          id={row.name}
          name={row.project_name}
          riskLevel={toKebabCase(row.rag_status)}
        />
      );
    case "phase":
      return <PhaseCell phase={toKebabCase(row[column.key])} />;
    case "burn_rate_per_week":
    case "total_budget":
    case "profit_margin":
    case "project_type":
    case "customer_name":
      return <TextCell text={row[column.key]} />;
    case "cost_burn_percent":
      return (
        <BudgetProgressCell
          percent={row.cost_burn.cost_accrued}
          secondaryPercent={row.cost_burn.cost_forecasted}
        />
      );
    case "start_date":
    case "next_milestone":
    case "end_date":
    case "contract_end_date":
      return <DateCell isoDate={row[column.key]} />;
    case "project_manager":
    case "engineering_manager":
      return <EmployeeCell employee={row[column.key]} />;
    default:
      return null;
  }
}
