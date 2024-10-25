import { getFieldInfo } from "./helper";
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setOrderBy } from "@/store/project";

const Sort = ({ metaFields, type }: { metaFields: any; type: string | undefined }) => {
  const fields = getFieldInfo(type);
  const dispatch = useDispatch();
  const projectState = useSelector((state: RootState) => state.project);
  const [order, setOrder] = useState<sortOrder>(projectState.order);
  const [orderColumn, setOrderColumn] = useState<string>(projectState.orderColumn);
  const [colMap, setColMap] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    setOrder(projectState.order);
    setOrderColumn(projectState.orderColumn);
  }, [projectState.order, projectState.orderColumn]);
  useEffect(() => {
    if (!metaFields) return;
    const columns = fields
      .map((field) => {
        const meta = metaFields.find((f: any) => f.fieldname === field);
        return { label: meta?.label, value: field };
      })
      .filter((i) => i.label);

    setColMap(columns);
  }, [metaFields]);

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
            {colMap.find((i) => i.value == orderColumn)?.label ?? "Sort"}
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent className="max-h-96 overflow-auto mr-3 [&_div]:hover:cursor-pointer">
        {colMap.map((i) => {
          return (
            <DropdownMenuCheckboxItem
              key={i.value}
              checked={i.value == orderColumn}
              onCheckedChange={() => {
                handleColumnChange(i.value);
              }}
            >
              {i.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Sort;
