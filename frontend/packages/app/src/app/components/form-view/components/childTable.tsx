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
  Input,
  Checkbox,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@next-pms/design-system/components";
import { Pencil, Trash2, Plus, NotepadText } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ChildRow, Field } from "../types";

interface ChildTableProps {
  field: Field;
}

const ChildTable = ({ field }: ChildTableProps) => {
  const [rows, setRows] = useState<ChildRow[]>((field?.value as ChildRow[]) || []);
  const [selected, setSelected] = useState<number[]>([]);
  const [editingRow, setEditingRow] = useState<ChildRow | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<ChildRow>>({});

  const toggleSelectAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.idx));
  };

  const toggleSelectRow = (idx: number) => {
    setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const handleAddRow = () => {
    const newRow: ChildRow = {
      idx: rows.length + 1,
      ...Object.fromEntries(field?.child_meta!.map((m) => [m.fieldname, ""])),
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteSelected = () => {
    setRows(rows.filter((r) => !selected.includes(r.idx)));
    setSelected([]);
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
                      <Checkbox checked={selected.includes(row.idx)} onCheckedChange={() => toggleSelectRow(row.idx)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono border-r px-2">{row.idx}</TableCell>
                  {field?.child_meta?.map((meta) => (
                    <TableCell key={meta.fieldname} className="border-r px-2 max-w-xs truncate">
                      <span title={String(row[meta.fieldname] ?? "")} className="block truncate">
                        {String(row[meta.fieldname] ?? "")}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-right px-0">
                    <div
                      className="w-full flex justify-center items-center
                "
                    >
                      <button onClick={() => handleEdit(row)} className="hover:text-primary">
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
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Row #{editingRow?.idx}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {field?.child_meta?.map((meta) => (
              <Input
                key={meta.fieldname}
                value={editedValues[meta.fieldname]?.toString() || ""}
                onChange={(e) =>
                  setEditedValues({
                    ...editedValues,
                    [meta.fieldname]: e.target.value,
                  })
                }
                placeholder={meta.label}
              />
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChildTable;
