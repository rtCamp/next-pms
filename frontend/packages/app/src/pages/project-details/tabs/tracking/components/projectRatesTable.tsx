import {
  Avatar,
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { RATE_COLUMNS } from "../constants";
import { useTracking } from "../context";
import { ActionsCell } from "./actionsCell";

const gridTemplateColumns = RATE_COLUMNS.map((c) => c.width).join(" ");

export function ProjectRatesTable() {
  const rows = useTracking((state) => state.rates);
  const flatRate = useTracking((state) => state.flatRate);

  if (!rows) return null;

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Project rates
        </span>
        <Button icon={AddSm} variant="subtle" />
      </div>
      <ListView
        columns={RATE_COLUMNS}
        rows={rows}
        rowKey="id"
        options={{ options: { selectable: false, resizeColumn: false } }}
      >
        <ListHeader className="mb-0 rounded-none bg-transparent px-2 py-0.5 gap-2">
          {RATE_COLUMNS.map((column, i) => (
            <ListHeaderItem
              key={column.key}
              item={column}
              lastItem={i === RATE_COLUMNS.length - 1}
            />
          ))}
        </ListHeader>
        <ListRows>
          {flatRate && (
            <div
              className="grid h-10 items-center rounded-md bg-surface-gray-2 px-2 gap-2"
              style={{ gridTemplateColumns }}
            >
              <div className="truncate text-base font-medium text-ink-gray-7">
                Flat rate
              </div>
              <div className="truncate text-right text-base text-ink-gray-6 tabular-nums">
                {flatRate.amount}
              </div>
              <div className="truncate text-base text-ink-gray-6 tabular-nums">
                {flatRate.date}
              </div>
              <div className="flex items-center justify-end">
                <ActionsCell onEdit={() => {}} onDelete={() => {}} />
              </div>
            </div>
          )}
          {rows.length === 0 && !flatRate ? (
            <div className="py-10 text-center text-sm text-ink-gray-4">
              No project rates yet
            </div>
          ) : (
            rows.map((row, i) => (
              <ListRow key={row.id} row={row} isLastRow={i === rows.length - 1}>
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar size="xs" label={row.name} image={row.image ?? ""} />
                  <span className="truncate text-base font-medium text-ink-gray-7">
                    {row.name}
                  </span>
                </div>
                <div className="truncate text-right text-base text-ink-gray-6 tabular-nums">
                  {row.amount}
                </div>
                <div className="truncate text-base text-ink-gray-6 tabular-nums">
                  {row.date}
                </div>
                <div className="flex items-center justify-end">
                  <ActionsCell onEdit={() => {}} onDelete={() => {}} />
                </div>
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
    </div>
  );
}
