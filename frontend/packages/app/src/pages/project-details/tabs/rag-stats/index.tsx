/**
 * External dependencies.
 */
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import {
  HISTORY_COLUMNS,
  STATUS_HISTORY,
  STATUS_TRIGGERS,
  TRIGGER_COLUMNS,
} from "./constants";
import type { ColumnDef } from "./types";
import { useProjectDetail } from "../../context";

const currentStatusVariants = cva("font-medium", {
  variants: {
    status: {
      Red: "text-ink-red-3",
      Amber: "text-ink-amber-3",
      Green: "text-ink-green-3",
    },
  },
});

function StatusTable({
  columns,
  rows,
}: {
  columns: ColumnDef[];
  rows: Array<Record<string, string>>;
}) {
  return (
    <ListView
      columns={columns}
      rows={rows}
      rowKey="id"
      options={{ options: { selectable: false, resizeColumn: false } }}
    >
      <ListHeader className="mb-0 rounded-none border-b border-outline-gray-1 bg-transparent p-1 px-2 gap-4">
        {columns.map((column) => (
          <ListHeaderItem key={column.key} item={column}>
            {column.label}
          </ListHeaderItem>
        ))}
      </ListHeader>
      <ListRows>
        {rows.map((row) => (
          <ListRow key={row.id} row={row} className="gap-4">
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex items-center text-base text-ink-gray-6"
              >
                <span className="truncate">{row[column.key]}</span>
              </div>
            ))}
          </ListRow>
        ))}
      </ListRows>
    </ListView>
  );
}

export function RagStats() {
  const status = useProjectDetail((s) => s.project?.custom_project_rag_status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink-gray-7">
          RAG Status Details
        </h2>
        <p className="text-sm font-medium text-ink-gray-6">
          Below are all trigger thresholds causing RAG status to be impacted
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl">
        <div className="flex items-center gap-1.5 text-base text-ink-gray-7">
          <span>Current Status:</span>
          {status ? (
            <span className={currentStatusVariants({ status })}>{status}</span>
          ) : (
            <span className="font-medium text-ink-gray-5">N/A</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-ink-gray-8">
            Status Triggers:
          </span>
          <StatusTable columns={TRIGGER_COLUMNS} rows={STATUS_TRIGGERS} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-ink-gray-8">
            Status History:
          </span>
          <StatusTable columns={HISTORY_COLUMNS} rows={STATUS_HISTORY} />
        </div>
      </div>
    </div>
  );
}
