/**
 * External dependencies.
 */
import { ListView } from "@rtcamp/frappe-ui-react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

import { DateCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { FAKE_PROJECTS } from "./fake-data";
import { formatCurrency, formatPercent } from "./format";
import type { Project } from "./types";

type ListViewColumn = { key: string; label: string; width?: string };

function ProjectListCell({
  item,
  column,
}: {
  item: unknown;
  column: ListViewColumn;
}) {
  switch (column.key) {
    case "name":
      return (
        <span className="font-medium text-ink-gray-8 truncate">
          {item as string}
        </span>
      );
    case "burnRatePerWeek":
    case "totalBudget":
      return <span>{formatCurrency(item as number)}</span>;
    case "profitMargin":
      return <span>{formatPercent(item as number)}</span>;
    case "startDate":
    case "nextMilestone":
    case "endDate":
    case "contractEndDate":
      return <DateCell isoDate={item as string} />;
    case "type":
    case "clientName":
      return <span>{item as string}</span>;
    default:
      return null;
  }
}

// Sticky first data column (Project name) on horizontal scroll.
// ListView wraps rows in two overflow-y-* divs (ListRows' h-full overflow-y-auto
// and ListView's w-max overflow-y-hidden). Both create scroll containers that
// block horizontal position:sticky from anchoring to the outer overflow-x-auto.
// Neutralize those intermediate overflow clauses so sticky resolves against
// the real horizontal scroll container. Then pin the 2nd grid child (Project
// name) flush-left. Header cells match the header bg; data cells fall back
// to surface-white — hovered/selected row highlights won't bleed into the
// sticky column (acceptable tradeoff per the Figma design).
const STICKY_NAME_COLUMN_CLASSES = [
  "[&_.h-full.overflow-y-auto]:overflow-y-visible",
  "[&_.w-max.overflow-y-hidden]:overflow-y-visible",
  "[&_.grid>*:nth-child(2)]:sticky",
  "[&_.grid>*:nth-child(2)]:left-0",
  "[&_.grid>*:nth-child(2)]:z-10",
  "[&_.grid>*:nth-child(2)]:bg-surface-white",
  "[&_.grid.bg-surface-gray-2>*:nth-child(2)]:bg-surface-gray-2",
].join(" ");

function ProjectList() {
  const navigate = useNavigate();

  return (
    <div className={STICKY_NAME_COLUMN_CLASSES}>
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
    </div>
  );
}

export default ProjectList;
