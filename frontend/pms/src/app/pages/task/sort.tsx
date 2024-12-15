/**
 * External dependencies.
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Separator } from "@/app/components/ui/separator";
import { RootState } from "@/store";
import { setOrderBy } from "@/store/task";
import { sortOrder } from "@/types";
import { columnMap } from "./helper";

const Sort = () => {
  const dispatch = useDispatch();
  const task = useSelector((state: RootState) => state.task);
  const [order, setOrder] = useState<sortOrder>(task.order);
  const [orderColumn, setOrderColumn] = useState<string>(task.orderColumn);

  const colMap = { ...columnMap, modified: "modified", creation: "creation" };

  const handleColumnChange = (key: string) => {
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
        <Button variant="outline" className=" rounded-tr-none rounded-br-none ring-0" onClick={handleOrderChange}>
          {order === "asc" ? <ArrowDownAZ /> : <ArrowDownZA />}
        </Button>

        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-normal rounded-tl-none border-l-0 rounded-bl-none ring-0 ">
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
