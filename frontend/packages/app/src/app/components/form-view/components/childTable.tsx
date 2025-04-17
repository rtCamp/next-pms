/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
  Button,
  toast,
} from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";
import { Pencil, Trash2, Plus, NotepadText } from "lucide-react";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ChildRow, Field } from "../types";
import DynamicFormDialog from "./dynamicFormDialog";

interface ChildTableProps {
  field: Field;
  currencySymbol: string;
}

const ChildTable = ({ field, currencySymbol }: ChildTableProps) => {
  const [rows, setRows] = useState<ChildRow[]>((field?.value as ChildRow[]) || []);
  const [selected, setSelected] = useState<Array<Record<string, string | number>>>([]);
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<ChildRow | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<ChildRow>>({});
  const { call: deleteChildTableRows } = useFrappePostCall("next_pms.api.child_table_bulk_delete");

  const toggleSelectAll = () => {
    if (selected.length === rows.length) {
      setSelected([]);
    } else {
      setSelected(rows);
    }
  };

  const toggleSelectRow = (row: ChildRow, e?: MouseEvent) => {
    if (e?.shiftKey && lastSelectedIdx !== null) {
      const currentIndex = rows.findIndex((r) => r.idx === row.idx);
      const lastIndex = rows.findIndex((r) => r.idx === lastSelectedIdx);
      const [start, end] = [Math.min(currentIndex, lastIndex), Math.max(currentIndex, lastIndex)];

      const rangeToToggle = rows.slice(start, end + 1);

      const allSelected = rangeToToggle.every((r) => selected.includes(r));

      if (allSelected) {
        // Deselect the entire range
        setSelected((prev) => prev.filter((r) => !rangeToToggle.includes(r)));
      } else {
        // Select missing ones in the range
        setSelected((prev) => Array.from(new Set([...prev, ...rangeToToggle])));
      }
    } else {
      setSelected((prev) => {
        if (prev.some((r) => r.idx === row.idx)) {
          // If row is already selected, remove it
          return prev.filter((r) => r.idx !== row.idx);
        } else {
          // If row is not selected, add it
          return [...prev, row];
        }
      });
    }

    setLastSelectedIdx(row.idx);
  };

  const handleAddRow = () => {
    const newRow: ChildRow = {
      idx: rows.length + 1,
      ...Object.fromEntries(field?.child_meta!.map((m) => [m.fieldname, ""])),
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteSelected = async () => {
    const data = selected.filter((row) => row.name).map((row) => row.name);
    if (data.length > 0) {
      await deleteChildTableRows({
        doctype: selected[0].parenttype,
        parent_name: selected[0].parent,
        child_fieldname: selected[0].parentfield,
        child_names: data,
      })
        .then((res) => {
          setRows(rows.filter((r) => !selected.some((s) => s.idx === r.idx)));
          setSelected([]);
          toast({
            variant: "success",
            description: res.message,
          });
        })
        .catch((err) => {
          const error = parseFrappeErrorMsg(err);
          toast({
            variant: "destructive",
            description: error,
          });
        });
    } else {
      setRows(rows.filter((r) => !selected.some((s) => s.idx === r.idx)));
      setSelected([]);
    }
  };

  const handleEdit = (row: ChildRow) => {
    setEditingRow(row);
    setEditedValues(row);
  };

  const handleSaveEdit = () => {
    if (editingRow) {
      setRows((prev) => prev.map((row) => (row.idx === editingRow.idx ? { ...row, ...editedValues } : row)));
      setEditingRow(null);
    }
  };

  useEffect(() => {
    setRows(field.value as ChildRow[]);
  }, [field]);

  return (
    <div className="space-y-3">
      <div className="overflow-auto border rounded-md">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-10 min-w-10 h-12 px-0 border-r border-b dark:border-slate-700">
                <div
                  className="w-full flex justify-center items-center
                "
                >
                  <Checkbox
                    checked={selected.length === rows.length && rows.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
              </TableHead>
              <TableHead className="w-12 text-center border-r dark:border-slate-700 font-normal">#</TableHead>
              {field?.child_meta
                ?.filter((obj) => obj.in_list_view === 1)
                .map((meta) => {
                  if (meta.label == null) return null;
                  return (
                    <TableHead
                      key={meta.fieldname}
                      className="border-r dark:border-slate-700 px-2 py-1 text-left text-sm truncate font-normal"
                    >
                      {meta.label}
                      {meta.reqd === 1 && <span className="text-red-400 ml-1">*</span>}
                    </TableHead>
                  );
                })}
              <TableHead className="w-8">
                {/* <div
                  className="w-full flex justify-center items-center
                "
                >
                  <Settings className="size-4 text-muted-foreground" />
                </div> */}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:!bg-transparent">
                <TableCell
                  colSpan={field?.child_meta!.filter((obj) => obj.in_list_view === 1).length + 3}
                  className="text-center py-4"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <NotepadText className="size-8" />
                    <span className="text-sm">No Data</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.idx} className="border-b divide-y">
                  <TableCell className="border-r border-b px-0">
                    <div
                      className="w-full flex justify-center items-center
                "
                    >
                      <Checkbox
                        checked={selected.some((r) => r.idx === row.idx)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(row, e.nativeEvent as MouseEvent);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono border-r px-2">{row.idx}</TableCell>
                  {field
                    ?.child_meta!.filter((obj) => obj.in_list_view === 1)
                    .map((meta) => (
                      <TableCell key={meta.fieldname} className="border-r px-2 max-w-xs truncate">
                        {meta.fieldtype === "Link" ? (
                          <a
                            target="_blank"
                            href={`/app/${meta.options.toLowerCase().replace(/[_\s]/g, "-")}/${encodeURIComponent(
                              row[meta.fieldname]
                            )}`}
                            title={String(row[meta.fieldname] ?? "")}
                            className="block truncate hover:underline"
                          >
                            {String(row[meta.fieldname] ?? "")}
                          </a>
                        ) : (
                          <span title={String(row[meta.fieldname] ?? "")} className="block truncate">
                            {String(row[meta.fieldname] ?? "")}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  <TableCell className="text-right px-0">
                    <div
                      className="w-full flex justify-center items-center
                "
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(row);
                        }}
                        className="hover:text-primary"
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Actions below table */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            handleAddRow();
          }}
        >
          <Plus className="size-4" /> Row
        </Button>

        {selected.length > 0 && (
          <Button
            className="dark:text-foreground hover:bg-destructive text-white bg-destructive dark:bg-red-500/80"
            onClick={(e) => {
              e.preventDefault();
              handleDeleteSelected();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
      </div>

      {/* Dialog */}
      <DynamicFormDialog
        open={!!editingRow}
        onClose={() => setEditingRow(null)}
        rowIndex={editingRow?.idx}
        value={field.value as ChildRow[]}
        fieldMeta={field.child_meta || []}
        rowName={editingRow?.name}
        currencySymbol={currencySymbol}
        onSubmit={(values) => {
          setEditedValues(values);
          handleSaveEdit();
        }}
      />
    </div>
  );
};

export default ChildTable;
