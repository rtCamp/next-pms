/**
 * Internal dependencies.
 */
import { BudgetProgressCell } from "./budgetProgressCell";
import { DateCell } from "./dateCell";
import { EmployeeCell } from "./employeeCell";
import { PhaseCell } from "./phaseCell";
import { ProjectNameCell } from "./projectNameCell";
import type { ListViewColumn, ResponseProject } from "../types";

export function ProjectListCell({
  row,
  column,
}: {
  row: ResponseProject;
  column: ListViewColumn;
}) {
  switch (column.key) {
    case "name":
      return (
        <ProjectNameCell
          id={row.name}
          name={row.project_name}
          riskLevel={row.custom_project_rag_status}
        />
      );
    case "phase":
      return <PhaseCell phase={"delivery-prep"} />;
    case "burnRatePerWeek":
    case "totalBudget":
      return (
        <span className="block truncate text-ink-gray-7 text-base">{`$${1000}`}</span>
      );
    case "costBurnPercent":
      return <BudgetProgressCell percent={50} secondaryPercent={70} />;
    case "profitMargin":
      return (
        <span className="block truncate text-ink-gray-7 text-base">10%</span>
      );
    case "startDate":
    case "nextMilestone":
    case "endDate":
    case "contractEndDate":
      return <DateCell isoDate={"2025-11-23"} />;
    case "projectManager":
      return (
        <EmployeeCell
          employee={{
            name: row.custom_engineering_manager_name,
            email: row.custom_engineering_manager,
          }}
        />
      );
    case "leadEngineer":
      return (
        <EmployeeCell
          employee={{
            name: row.custom_engineering_manager_name,
            email: row.custom_engineering_manager,
          }}
        />
      );
    case "type":
    case "clientName":
      return (
        <span className="block truncate text-ink-gray-7 text-base">
          Client{" "}
        </span>
      );
    default:
      return null;
  }
}
