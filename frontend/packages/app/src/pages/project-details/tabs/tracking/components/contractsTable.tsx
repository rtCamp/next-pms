/**
 * External dependencies.
 */
import { useState } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import {
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { CONTRACT_COLUMNS } from "../constants";
import { useTracking } from "../context";
import { ActionsCell } from "./actionsCell";
import { ContractModal } from "./contractModal";

export function ContractsTable() {
  const rows = useTracking((state) => state.contracts);
  const createContract = useTracking((state) => state.createContract);
  const editContract = useTracking((state) => state.editContract);
  const deleteContract = useTracking((state) => state.deleteContract);
  const editingContract = useTracking((state) => state.editingContract);
  const setEditingContract = useTracking((state) => state.setEditingContract);
  const addContractModalOpen = useTracking(
    (state) => state.addContractModalOpen,
  );
  const setAddContractModalOpen = useTracking(
    (state) => state.setAddContractModalOpen,
  );
  const [deletingContract, setDeletingContract] = useState<string | null>(null);

  if (!rows) return null;

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink-gray-8">
          Contracts
        </span>
        <Button
          icon={AddSm}
          variant="subtle"
          onClick={() => setAddContractModalOpen(true)}
        />
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
                      <ActionsCell
                        onEdit={() => setEditingContract(row)}
                        onDelete={() => setDeletingContract(row.name)}
                      />
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
                      <span className="truncate">
                        {(column.key === "startDate" ||
                          column.key === "endDate") &&
                        row[column.key]
                          ? format(parseISO(row[column.key]), "MMM d, yyyy")
                          : row[column.key]}
                      </span>
                    </div>
                  ),
                )}
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
      <ContractModal
        open={addContractModalOpen}
        onOpenChange={setAddContractModalOpen}
        onSubmit={createContract}
      />
      <ContractModal
        mode="edit"
        open={!!editingContract}
        onOpenChange={(next) => {
          if (!next) setEditingContract(null);
        }}
        initialValues={
          editingContract
            ? {
                startDate: editingContract.startDate,
                endDate: editingContract.endDate,
                hoursBought: String(editingContract.hoursBoughtRaw),
                salesOrder: editingContract.salesOrder,
                salesInvoice: editingContract.salesInvoice,
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (!editingContract) return;
          await editContract({
            name: editingContract.name,
            startDate: input.startDate,
            endDate: input.endDate,
            hoursBought: input.hoursBought,
            salesOrder: input.salesOrder,
            salesInvoice: input.salesInvoice,
          });
          setEditingContract(null);
        }}
      />
      {deletingContract && (
        <DeleteActionDialog
          title="Delete contract"
          description="Are you sure you want to delete this contract? This action cannot be undone."
          onClose={() => setDeletingContract(null)}
          onConfirm={() => deleteContract(deletingContract)}
        />
      )}
    </div>
  );
}
