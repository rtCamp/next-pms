/**
 * External dependencies.
 */
import {
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { CONTRACT_COLUMNS } from "../constants";
import { useTracking } from "../context";
import { ActionsCell } from "./actionsCell";

export function ContractsTable() {
  const rows = useTracking((state) => state.contracts);

  if (!rows) return null;

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Contracts
        </span>
        <Button icon={AddSm} variant="subtle" />
      </div>
      <ListView
        columns={CONTRACT_COLUMNS}
        rows={rows}
        rowKey="id"
        options={{ options: { selectable: false, resizeColumn: false } }}
      >
        <ListHeader className="mb-0 rounded-none border-b border-outline-gray-1 bg-transparent p-1 px-2 gap-4">
          {CONTRACT_COLUMNS.map((column) => (
            <ListHeaderItem key={column.key} item={column}>
              {column.label}
            </ListHeaderItem>
          ))}
        </ListHeader>
        <ListRows>
          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-gray-4">
              No contracts yet
            </div>
          ) : (
            rows.map((row) => (
              <ListRow key={row.id} row={row} className="gap-4">
                {CONTRACT_COLUMNS.map((column) =>
                  column.key === "actions" ? (
                    <div
                      key={column.key}
                      className="flex items-center justify-end"
                    >
                      <ActionsCell onEdit={() => {}} onDelete={() => {}} />
                    </div>
                  ) : (
                    <div
                      key={column.key}
                      className={mergeClassNames(
                        "flex items-center text-base text-ink-gray-6",
                        {
                          "justify-end": column.align === "right",
                        },
                      )}
                    >
                      <span className="truncate">{row[column.key]}</span>
                    </div>
                  ),
                )}
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
    </div>
  );
}
