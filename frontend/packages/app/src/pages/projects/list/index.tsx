/**
 * External dependencies.
 */
import { ListView } from "@rtcamp/frappe-ui-react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

import {
  BudgetProgressCell,
  DateCell,
  EmployeeCell,
  PhaseCell,
  ProjectNameCell,
} from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { FAKE_PROJECTS } from "./fake-data";
import { formatCurrency, formatPercent } from "./format";
import type { Project } from "./types";

type ListViewColumn = { key: string; label: string; width?: string };

function ProjectListCell({
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
      return <ProjectNameCell name={row.name} riskLevel={row.riskLevel} />;
    case "phase":
      return <PhaseCell phase={row.phase} />;
    case "burnRatePerWeek":
    case "totalBudget":
      return <span>{formatCurrency(item as number)}</span>;
    case "costBurnPercent":
      return <BudgetProgressCell percent={item as number} />;
    case "profitMargin":
      return <span>{formatPercent(item as number)}</span>;
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

function ProjectList() {
  const navigate = useNavigate();

  return (
    <ListView
      columns={PROJECT_LIST_COLUMNS}
      rows={FAKE_PROJECTS}
      rowKey="id"
      options={{
        options: {
          selectable: true,
          showTooltip: true,
          resizeColumn: true,
          onRowClick: (row: Project) =>
            navigate(`${ROUTES.project}/${row.id}`),
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    />
  );
}

export default ProjectList;
