import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { mergeClassNames } from "@/lib/utils";
import { CONTRACT_COLUMNS } from "../constants";
import type { ContractRow } from "../types";
import { ActionsCell } from "./actionsCell";

const gridTemplateColumns = CONTRACT_COLUMNS.map((c) => c.width).join(" ");

type ContractsTableProps = {
  rows: ContractRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ContractsTable({
  rows,
  onEdit,
  onDelete,
}: ContractsTableProps) {
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Contracts
        </span>
        <a
          href="/desk/contract/new-contract"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Button icon={AddSm} variant="subtle" />
        </a>
      </div>
      <div className="flex flex-col">
        <div
          className="grid items-center border-b border-outline-gray-1 px-1 py-0.5 text-sm text-ink-gray-5"
          style={{ gridTemplateColumns }}
        >
          {CONTRACT_COLUMNS.map((column) => (
            <div
              key={column.key}
              className={mergeClassNames(
                "flex h-7 items-center px-2",
                column.align === "right" && "justify-end",
              )}
            >
              {column.srOnly ? (
                <span className="sr-only">{column.label}</span>
              ) : (
                <span className="truncate">{column.label}</span>
              )}
            </div>
          ))}
        </div>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-gray-4">
            No contracts
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid h-10 items-center border-b border-outline-gray-1 px-1 py-2 text-base text-ink-gray-6 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="truncate px-2">{row.startDate}</div>
              <div className="truncate px-2">{row.endDate}</div>
              <div className="truncate px-2 text-right tabular-nums">
                {row.hoursBought}
              </div>
              <div className="truncate px-2 text-right tabular-nums">
                {row.hoursUsed}
              </div>
              <div className="truncate px-2 text-right tabular-nums">
                {row.hoursLeft}
              </div>
              <div className="truncate px-2">{row.salesOrder}</div>
              <div className="truncate px-2">{row.salesInvoice}</div>
              <div className="flex justify-end">
                <ActionsCell
                  onEdit={() => onEdit(row.id)}
                  onDelete={() => onDelete(row.id)}
                  editLabel="Edit contract"
                  deleteLabel="Delete contract"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
