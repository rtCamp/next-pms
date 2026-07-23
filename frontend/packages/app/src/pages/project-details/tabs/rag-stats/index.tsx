/**
 * External dependencies.
 */
import { ErrorFallback, Spinner } from "@next-pms/design-system/components";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
  Tooltip,
} from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { RagComments } from "./comments";
import { HISTORY_COLUMNS, TRIGGER_COLUMNS } from "./constants";
import type { ColumnDef, DatePrecision, RagHistory, RagTrigger } from "./types";
import { useProjectRagDetails } from "./useProjectRagDetails";

const ragColourVariants = cva("font-medium", {
  variants: {
    colour: {
      Red: "text-ink-red-3",
      Amber: "text-ink-amber-3",
      Green: "text-ink-green-3",
    },
  },
});

function formatTriggerDate(date: string | null, precision?: DatePrecision) {
  if (!date) return "—";
  const formatted = format(parseISO(date), "MMM d, yyyy");
  if (precision === "Approximate") {
    return (
      <Tooltip text="Approximate date — refreshed on the weekly RAG recompute.">
        <span>~{formatted}</span>
      </Tooltip>
    );
  }
  return formatted;
}

function renderCell(column: ColumnDef, row: RagTrigger | RagHistory) {
  switch (column.key) {
    case "type":
      return (
        <Tooltip text={row.type_label}>
          <span className="truncate">{row.type_label}</span>
        </Tooltip>
      );
    case "trigger_date":
      return formatTriggerDate(row.trigger_date, row.date_precision);
    case "clear_date":
      return formatTriggerDate((row as RagHistory).clear_date);
    default:
      return <span className="truncate">{row.alert}</span>;
  }
}

function StatusTable({
  columns,
  rows,
  rowKey,
  emptyMessage,
}: {
  columns: ColumnDef[];
  rows: Array<RagTrigger | RagHistory>;
  rowKey: (row: RagTrigger | RagHistory) => string;
  emptyMessage: string;
}) {
  return (
    <ListView
      columns={columns}
      rows={rows}
      rowKey="type"
      options={{ options: { selectable: false, resizeColumn: false } }}
    >
      <ListHeader className="mb-0 rounded-none border-b border-outline-gray-1 bg-transparent p-1 px-2 gap-4">
        {columns.map((column) => (
          <ListHeaderItem key={column.key} item={column}>
            {column.label}
          </ListHeaderItem>
        ))}
      </ListHeader>
      {rows.length === 0 ? (
        <div className="p-2 text-base text-ink-gray-5">{emptyMessage}</div>
      ) : (
        <ListRows>
          {rows.map((row) => (
            <ListRow key={rowKey(row)} row={row} className="gap-4">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex min-w-0 items-center text-base text-ink-gray-6"
                >
                  {renderCell(column, row)}
                </div>
              ))}
            </ListRow>
          ))}
        </ListRows>
      )}
    </ListView>
  );
}

export function RagStats() {
  const { details, isLoading, error } = useProjectRagDetails();

  if (isLoading) {
    return <Spinner className="py-16" />;
  }

  if (error) {
    return (
      <p className="text-base text-ink-red-3">
        {error.message || "Failed to load RAG status details."}
      </p>
    );
  }

  const status = details?.current_status;

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

      <div className="flex flex-col gap-4 rounded-xl space-y-10">
        <div className="flex items-center gap-1.5 text-base text-ink-gray-7">
          <span>Current Status:</span>
          {status ? (
            <span className={ragColourVariants({ colour: status })}>
              {status}
            </span>
          ) : (
            <span className="font-medium text-ink-gray-5">N/A</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-ink-gray-8">
            Status Triggers:
          </span>
          <StatusTable
            columns={TRIGGER_COLUMNS}
            rows={details?.triggers ?? []}
            rowKey={(row) => row.type}
            emptyMessage="No active triggers."
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-ink-gray-8">
            Status History:
          </span>
          <StatusTable
            columns={HISTORY_COLUMNS}
            rows={details?.history ?? []}
            rowKey={(row) =>
              `${row.type}-${(row as RagHistory).clear_date ?? ""}`
            }
            emptyMessage="No cleared triggers yet."
          />
        </div>
      </div>

      <ErrorFallback>
        <RagComments />
      </ErrorFallback>
    </div>
  );
}
