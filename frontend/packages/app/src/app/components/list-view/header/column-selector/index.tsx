/**
 * External dependencies
 */

import { useState, useEffect } from "react";
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
import { ColumnSelectorProps } from "@/app/components/list-view/type";
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
const ColumnSelector = ({ fieldMeta, onColumnHide, setColumnOrder, columnOrder }: ColumnSelectorProps) => {
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  // Synchronize local state with the main columnOrder prop
  useEffect(() => {
    setLocalOrder(columnOrder);
  }, [columnOrder]);

  const fieldMap = localOrder
    .map((row) => {
      const d = fieldMeta.find((f: { fieldname: string }) => f.fieldname === row);
      return d !== undefined ? d : null;
    })
    .filter((d) => d !== null);

  const fields = fieldMeta
    .filter((d) => !NO_VALUE_FIELDS.includes(d.fieldtype))
    .filter((d) => !localOrder.includes(d.fieldname));

  const handleColumnAdd = (fieldname: string) => {
    setLocalOrder((old) => [...old, fieldname]);
    setColumnOrder((old) => [...old, fieldname]);
  };

  const handleReorder = (newOrder: string[]) => {
    setLocalOrder(newOrder);
  };
  const handleDrop = () => {
    setColumnOrder(localOrder); // Update the parent/main state on drop
  };

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
          {fieldMap.map((field) => {
            return (
              <ColumnItem
                key={field.fieldname}
                id={field.fieldname}
                label={field.label}
                onColumnHide={onColumnHide}
                isVisible={localOrder.includes(field.fieldname)}
                toggleVisibility={() => {}}
                reOrder={handleReorder}
                onDrop={handleDrop}
              />
            );
          })}
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
