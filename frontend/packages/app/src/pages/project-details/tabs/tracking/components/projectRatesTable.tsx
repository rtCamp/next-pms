import { Avatar } from "@rtcamp/frappe-ui-react";
import { mergeClassNames } from "@/lib/utils";
import { RATE_COLUMNS } from "../constants";
import type { RateRow } from "../types";
import { ActionsCell } from "./actionsCell";

const gridTemplateColumns = RATE_COLUMNS.map((c) => c.width).join(" ");

type ProjectRatesTableProps = {
  rows: RateRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ProjectRatesTable({
  rows,
  onEdit,
  onDelete,
}: ProjectRatesTableProps) {
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base text-ink-gray-8 font-medium">
          Project rates
        </span>
      </div>
      <div className="rounded-md">
        <div
          className="grid items-center gap-2 border-b border-outline-gray-1 px-2 py-1.5 text-sm text-ink-gray-5"
          style={{ gridTemplateColumns }}
        >
          {RATE_COLUMNS.map((column) => (
            <div
              key={column.key}
              className={mergeClassNames(
                "flex h-7 items-center",
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
            No rates
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-2 border-b border-outline-gray-1 px-2 py-2 text-base text-ink-gray-7 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar size="sm" label={row.name} image={row.image ?? ""} />
                <span className="truncate">{row.name}</span>
              </div>
              <div className="truncate">{row.rateLabel}</div>
              <div className="truncate text-right tabular-nums">
                {row.amount}
              </div>
              <div className="truncate text-right tabular-nums">{row.date}</div>
              <div className="flex justify-end">
                <ActionsCell
                  onEdit={() => onEdit(row.id)}
                  onDelete={() => onDelete(row.id)}
                  editLabel="Edit rate"
                  deleteLabel="Remove rate"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
