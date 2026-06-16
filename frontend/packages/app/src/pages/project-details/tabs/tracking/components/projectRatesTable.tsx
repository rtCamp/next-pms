/**
 * External dependencies.
 */
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

/**
 * Internal dependencies.
 */
import { RATE_COLUMNS } from "../constants";
import { useTracking } from "../context";
import { ActionsCell } from "./actionsCell";
import { ProjectRateModal } from "./projectRateModal";

const gridTemplateColumns = RATE_COLUMNS.map((c) => c.width).join(" ");

export function ProjectRatesTable() {
  const rows = useTracking((state) => state.rates);
  const flatRate = useTracking((state) => state.flatRate);
  const deleteRate = useTracking((state) => state.deleteRate);
  const createRate = useTracking((state) => state.createRate);
  const editRate = useTracking((state) => state.editRate);
  const editingRate = useTracking((state) => state.editingRate);
  const setEditingRate = useTracking((state) => state.setEditingRate);
  const addRateModalOpen = useTracking((state) => state.addRateModalOpen);
  const setAddRateModalOpen = useTracking((state) => state.setAddRateModalOpen);

  if (!rows) return null;

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Project rates
        </span>
        <Button
          icon={AddSm}
          variant="subtle"
          onClick={() => setAddRateModalOpen(true)}
        />
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
              className="grid h-10 items-center rounded-md bg-surface-gray-2 px-2 gap-2 mt-2"
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
                  <Avatar
                    size="xs"
                    label={row.employeeName}
                    image={row.image ?? ""}
                  />
                  <span className="truncate text-base font-medium text-ink-gray-7">
                    {row.employeeName}
                  </span>
                </div>
                <div className="truncate text-right text-base text-ink-gray-6 tabular-nums">
                  {row.amount}
                </div>
                <div className="truncate text-base text-ink-gray-6 tabular-nums">
                  {row.date}
                </div>
                <div className="flex items-center justify-end">
                  <ActionsCell
                    onEdit={() => setEditingRate(row)}
                    onDelete={() => deleteRate(row.name)}
                  />
                </div>
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
      <ProjectRateModal
        open={addRateModalOpen}
        onOpenChange={setAddRateModalOpen}
        onSubmit={createRate}
      />
      <ProjectRateModal
        mode="edit"
        open={!!editingRate}
        onOpenChange={(next) => {
          if (!next) setEditingRate(null);
        }}
        initialValues={
          editingRate
            ? {
                employee: editingRate.employee,
                hourlyRate: String(editingRate.hourlyRate),
                validFrom: editingRate.date,
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (!editingRate) return;
          await editRate({
            name: editingRate.name,
            employee: input.employee ?? "",
            hourlyRate: input.hourlyRate,
            validFrom: input.validFrom,
          });
          setEditingRate(null);
        }}
      />
    </div>
  );
}
