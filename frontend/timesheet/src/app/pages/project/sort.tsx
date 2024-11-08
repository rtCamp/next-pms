import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import { sortOrder } from "@/types";
import { Button } from "@/app/components/ui/button";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";
import { useDispatch } from "react-redux";

import { setOrderBy } from "@/store/project";

interface SortProps {
  fieldMeta: Array<any>;
  rows: Array<string>;
  orderBy: sortOrder;
  field: string;
}
const Sort = ({ fieldMeta, rows, orderBy, field }: SortProps) => {
  const dispatch = useDispatch();
  const [order, setOrder] = useState<sortOrder>(orderBy);
  const [orderColumn, setOrderColumn] = useState<string>(field);

  useEffect(() => {
    setOrder(orderBy);
    setOrderColumn(field);
  }, [orderBy, field]);

  const colMap = Object.fromEntries(
    rows
      .filter((value) => value !== "creation" && value !== "modified" && value !== "name")
      .map((value) => {
        const meta = fieldMeta.find((f) => f.fieldname === value);
        return [value, meta?.label ?? value];
      })
  );

  const handleColumnChange = (key: string) => {
    if (key === orderColumn) return;
    setOrderColumn(key);
    dispatch(setOrderBy({ order, orderColumn: key }));
  };
  const handleOrderChange = () => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrder(newOrder);
    dispatch(setOrderBy({ order: newOrder, orderColumn: orderColumn }));
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
