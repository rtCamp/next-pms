import { Avatar, Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { mergeClassNames } from "@/lib/utils";
import { RATE_COLUMNS } from "../constants";
import type { RateRow } from "../types";
import { ActionsCell } from "./actionsCell";

const gridTemplateColumns = RATE_COLUMNS.map((c) => c.width).join(" ");

type ProjectRatesTableProps = {
  rows: RateRow[];
  flatRate?: { amount: string; date: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  onEditFlatRate?: () => void;
  onDeleteFlatRate?: () => void;
};

export function ProjectRatesTable({
  rows,
  flatRate,
  onEdit,
  onDelete,
  onAdd,
  onEditFlatRate,
  onDeleteFlatRate,
}: ProjectRatesTableProps) {
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Project rates
        </span>
        <Button icon={AddSm} variant="subtle" onClick={onAdd} />
      </div>
      <div className="flex flex-col">
        <div
          className="grid items-center px-1 py-0.5 text-sm text-ink-gray-5"
          style={{ gridTemplateColumns }}
        >
          {RATE_COLUMNS.map((column) => (
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
        {flatRate && (
          <div
            className="grid h-10 items-center rounded-md bg-surface-gray-2 px-1 py-2 text-base font-medium text-ink-gray-7"
            style={{ gridTemplateColumns }}
          >
            <div className="truncate px-1.5">Flat rate</div>
            <div className="truncate px-2 text-right font-normal text-ink-gray-6 tabular-nums">
              {flatRate.amount}
            </div>
            <div className="truncate px-2 font-normal text-ink-gray-6 tabular-nums">
              {flatRate.date}
            </div>
            <div className="flex justify-end">
              <ActionsCell
                onEdit={() => onEditFlatRate?.()}
                onDelete={() => onDeleteFlatRate?.()}
                editLabel="Edit flat rate"
                deleteLabel="Remove flat rate"
              />
            </div>
          </div>
        )}
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-gray-4">
            No rates
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid h-10 items-center border-b border-outline-gray-1 px-1 py-2 text-base font-medium text-ink-gray-7 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="flex min-w-0 items-center gap-2 px-1.5">
                <Avatar size="xs" label={row.name} image={row.image ?? ""} />
                <span className="truncate">{row.name}</span>
              </div>
              <div className="truncate px-2 text-right font-normal text-ink-gray-6 tabular-nums">
                {row.amount}
              </div>
              <div className="truncate px-2 font-normal text-ink-gray-6 tabular-nums">
                {row.date}
              </div>
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
