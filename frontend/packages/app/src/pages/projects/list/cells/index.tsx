/**
 * Internal dependencies.
 */
import { BudgetProgressCell } from "./budgetProgressCell";
import { DateCell } from "./dateCell";
import { EmployeeCell } from "./employeeCell";
import { PhaseCell } from "./phaseCell";
import { ProjectNameCell } from "./projectNameCell";
import type { ListViewColumn, Project } from "../types";

export function ProjectListCell({
  row,
  column,
  item,
}: {
  row: Project;
  column: ListViewColumn;
  item: unknown;
}) {
  switch (column.key) {
    case "name":
      return (
        <ProjectNameCell
          id={row.id}
          name={row.name}
          riskLevel={row.riskLevel}
        />
      );
    case "phase":
      return <PhaseCell phase={row.phase} />;
    case "burnRatePerWeek":
    case "totalBudget":
      return (
        <span className="block truncate text-ink-gray-7 text-base">
          {`$${(item as number).toLocaleString("en-US")}`}
        </span>
      );
    case "costBurnPercent":
      return <BudgetProgressCell percent={item as number} />;
    case "profitMargin":
      return (
        <span className="block truncate text-ink-gray-7 text-base">{`${item}%`}</span>
      );
    case "startDate":
    case "nextMilestone":
    case "endDate":
    case "contractEndDate":
      return <DateCell isoDate={item as string} />;
    case "projectManager":
      return <EmployeeCell employee={row.projectManager} />;
    case "leadEngineer":
      return <EmployeeCell employee={row.leadEngineer} />;
    case "type":
    case "clientName":
      return (
        <span className="block truncate text-ink-gray-7 text-base">
          {item as string}
        </span>
      );
    default:
      return null;
  }
}
