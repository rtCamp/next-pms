import { checkIsMobile, NO_VALUE_FIELDS } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Columns2 } from "lucide-react";
import { Typography } from "../typography";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import ColumnItem from "./ColumnItem";

const ColumnSelector = ({
  fieldMeta,
  onColumnHide,
  setColumnOrder,
  columnOrder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldMeta: Array<any>;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setColumnOrder: any;
  columnOrder: string[];
}) => {
  const fieldMap = columnOrder
    .map((row) => {
      const d = fieldMeta.find((f: { fieldname: string }) => f.fieldname === row);
      return d !== undefined ? d : null;
    })
    .filter((d) => d !== null);

  const fields = fieldMeta
    .filter((d) => !NO_VALUE_FIELDS.includes(d.fieldtype))
    .filter((d) => !columnOrder.includes(d.fieldname));

  const handleColumnAdd = (fieldname: string) => {
    setColumnOrder((old: string[]) => {
      const newOrder = [...old];
      newOrder.push(fieldname);
      return newOrder;
    });
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
          {fieldMap
            .sort((a, b) => columnOrder.indexOf(a.fieldname) - columnOrder.indexOf(b.fieldname))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((field: any) => {
              const isVisible = columnOrder.includes(field.fieldname);
              return (
                <ColumnItem
                  key={field.fieldname}
                  id={field.fieldname}
                  label={field.label}
                  onColumnHide={onColumnHide}
                  isVisible={isVisible}
                  toggleVisibility={() => {}}
                  reOrder={setColumnOrder}
                />
              );
            })}
        </DndProvider>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Add Columns</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="[&_div]:cursor-pointer max-h-96 overflow-y-auto">
              {fields.map((field: any) => {
                return (
                  <DropdownMenuItem
                    key={field.fieldname}
                    className="capitalize cursor-pointer flex gap-x-2 items-center"
                    onSelect={(event) => event.preventDefault()}
                    onClick={() => {
                      handleColumnAdd(field.fieldname);
                    }}
                  >
                    {field.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnSelector;
