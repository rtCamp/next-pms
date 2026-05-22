/**
 * Internal dependencies.
 */
import { toKebabCase } from "@/lib/utils";
import { BudgetProgressCell } from "./budgetProgressCell";
import { CurrencyCell } from "./currencyCell";
import { DateCell } from "./dateCell";
import { EmployeeCell } from "./employeeCell";
import { PercentCell } from "./percentCell";
import { PhaseCell } from "./phaseCell";
import { ProjectNameCell } from "./projectNameCell";
import { TextCell } from "./textCell";
import type { ListViewColumn } from "../../types";
import { ProjectListItem } from "../types";

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
      return <CurrencyCell value={row[column.key]} currency={row.currency} />;
    case "profit_margin":
      return <PercentCell value={row[column.key]} />;
    case "project_type":
    case "customer":
      return <TextCell text={row[column.key]} />;
    case "cost_burn_percent": {
      const { cost_accrued, cost_forecasted, total_budget } = row.cost_burn;
      const percent =
        total_budget > 0 ? (cost_accrued / total_budget) * 100 : 0;
      const secondaryPercent =
        total_budget > 0 ? (cost_forecasted / total_budget) * 100 : 0;
      return (
        <BudgetProgressCell
          percent={percent}
          secondaryPercent={secondaryPercent}
        />
      );
    }
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
