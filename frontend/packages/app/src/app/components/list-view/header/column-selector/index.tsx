/**
 * External dependencies
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import {
  Typography,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@next-pms/design-system/components";
import { Columns2 } from "lucide-react";
/**
 * Internal dependencies
 */
import { ColumnSelectorProps } from "@/app/components/list-view/types";
import { checkIsMobile, NO_VALUE_FIELDS } from "@/lib/utils";
import ColumnItem from "./columnItem";

/**
 * ColumnSelector Component
 * @description This component is used to select the columns to display in the list view.
 *
 * @param {Object} props - The props for the component.
 * @param {Array} props.fieldMeta - Meta data of the permitted fields.
 * @param {Function} props.onColumnHide - Function to hide the column.
 * @param {Function} props.setColumnOrder - Function to set the column order.
 * @param {Array} props.columnOrder - The order of the columns.
 */
const ColumnSelector = ({
  fieldMeta,
  onColumnHide,
  setColumnOrder,
  columnOrder,
}: ColumnSelectorProps) => {
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  useEffect(() => {
    setLocalOrder(columnOrder);
  }, [columnOrder]);

  const fieldMap = useMemo(
    () =>
      localOrder
        .map((row) => fieldMeta.find((f) => f.fieldname === row) || null)
        .filter((d) => d !== null),
    [localOrder, fieldMeta],
  );

  const fields = useMemo(
    () =>
      fieldMeta
        .filter((d) => !NO_VALUE_FIELDS.includes(d.fieldtype))
        .filter((d) => !localOrder.includes(d.fieldname)),
    [fieldMeta, localOrder],
  );

  const handleColumnAdd = useCallback(
    (fieldname: string) => {
      setLocalOrder((old) => [...old, fieldname]);
      setColumnOrder((old) => [...old, fieldname]);
    },
    [setColumnOrder],
  );

  const handleDrop = useCallback(() => {
    setColumnOrder(localOrder);
  }, [localOrder, setColumnOrder]);

  return (
    <DropdownMenu modal>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns2 />
          <Typography variant="p">Columns</Typography>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
        <DndProvider backend={checkIsMobile() ? TouchBackend : HTML5Backend}>
          {fieldMap.map((field) => (
            <ColumnItem
              key={field.fieldname}
              id={field.fieldname}
              label={field.label}
              onColumnHide={onColumnHide}
              reOrder={setLocalOrder}
              onDrop={handleDrop}
            />
          ))}
        </DndProvider>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Add Columns</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <DropdownMenuItem
                  key={field.fieldname}
                  className="capitalize cursor-pointer flex gap-x-2 items-center"
                  onSelect={(event) => event.preventDefault()}
                  onClick={() => handleColumnAdd(field.fieldname)}
                >
                  {field.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnSelector;
