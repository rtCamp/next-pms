/**
 * External dependencies
 */
import { useEffect, useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@next-pms/design-system/components";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";

/**
 * Internal dependencies
 */
import type { sortOrder } from "@/types";
import type { SortProps } from "../types";

/**
 * Sort Component
 * @description This component is used to sort the list view data based on field meta.
 *
 * @param {Object} props - The props for the component.
 * @param {Array} props.fieldMeta - Meta data of the permitted fields.
 * @param {String} props.orderBy - Order of the data (ASC/DESC).
 * @param {String} props.field - Field to sort the data on.
 * @param {Function} props.onSortChange - Function to handle the sort change.
 */
const Sort = ({ fieldMeta, orderBy, field, onSortChange }: SortProps) => {
  const [order, setOrder] = useState<sortOrder>(orderBy);
  const [orderColumn, setOrderColumn] = useState<string>(field);

  useEffect(() => {
    setOrder(orderBy);
    setOrderColumn(field);
  }, [orderBy, field]);

  const colMap = Object.fromEntries(
    fieldMeta.map((meta) => [meta.fieldname, meta.label ?? meta.fieldname]),
  );

  const handleColumnChange = (key: string) => {
    if (key === orderColumn) return;
    setOrderColumn(key);
    onSortChange(order, key);
  };
  const handleOrderChange = () => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrder(newOrder);
    onSortChange(newOrder, orderColumn);
  };
  return (
    <DropdownMenu>
      <div className="flex items-center">
        <Button
          variant="outline"
          className=" rounded-tr-none rounded-br-none ring-0 outline-0 ring-offset-0 focus-visible:ring-0"
          onClick={handleOrderChange}
        >
          {order === "asc" ? <ArrowDownAZ /> : <ArrowDownZA />}
        </Button>

        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="font-normal rounded-tl-none border-l-0 rounded-bl-none ring-0 outline-0 ring-offset-0 focus-visible:ring-0"
          >
            {colMap[orderColumn] ?? "Sort"}
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent className="max-h-96 overflow-auto mr-3 [&_div]:hover:cursor-pointer">
        {Object.entries(colMap).map(([key, value]: [string, string]) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={key == orderColumn}
            onCheckedChange={() => {
              handleColumnChange(key);
            }}
          >
            {value}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Sort;
