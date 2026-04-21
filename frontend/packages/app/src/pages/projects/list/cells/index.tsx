/**
 * Internal dependencies.
 */
import { BudgetProgressCell } from "./budget-progress-cell";
import { DateCell } from "./date-cell";
import { EmployeeCell } from "./employee-cell";
import { PhaseCell } from "./phase-cell";
import { ProjectNameCell } from "./project-name-cell";
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
      return <span>{`$${(item as number).toLocaleString("en-US")}`}</span>;
    case "costBurnPercent":
      return <BudgetProgressCell percent={item as number} />;
    case "profitMargin":
      return <span>{`${item}%`}</span>;
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
      return <span>{item as string}</span>;
    default:
      return null;
  }
}
