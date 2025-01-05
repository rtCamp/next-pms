/**
 * External dependencies.
 */
import { useContext } from "react";
import { isToday } from "date-fns";

/**
 * Internal dependencies.
 */
import { Typography } from "@/app/components/typography";
import { TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { cn, prettyDate } from "@/lib/utils";
import { DateProps } from "@/store/resource_management/team";

import { TableContext } from "../contexts/tableContext";
import { getTableCellClass } from "../utils/helper";

interface ResourceTableHeaderProps {
  dates: DateProps[];
  title: string;
}

/**
 * This component is used to render the table header for the resource management table.
 *
 * @param props.dates The dates list
 * @param props.title The title of Table header.
 * @returns React.FC
 */
const ResourceTableHeader = ({ dates, title }: ResourceTableHeaderProps) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);

  return (
    <TableHeader className="border-t-0 sticky top-0 z-30">
      <TableRow className="flex items-center flex-shrink-0">
        <TableHead
          className={cn("flex items-center sticky left-0 z-30 bg-muted py-10")}
          style={{ width: getCellWidthString(tableProperties.firstCellWidth) }}
        >
          {title}
        </TableHead>
        <div className="flex flex-col">
          <div className="flex items-center">
            {dates.map((date: DateProps, weekIndex: number) => {
              return (
                <Typography
                  variant="small"
                  className={cn(
                    "py-2 text-center truncate cursor-pointer border-r border-gray-300",
                    weekIndex == 0 && "border-l"
                  )}
                  style={{ width: getCellWidthString(tableProperties.cellWidth * 5) }}
                >
                  {date.key}
                </Typography>
              );
            })}
          </div>
          <div className="flex items-center">
            {dates.map((item: DateProps, weekIndex: number) => {
              return item?.dates?.map((date, index) => {
                const { date: dateStr, day } = prettyDate(date);
                return (
                  <TableHead
                    key={date}
                    className={cn(
                      getTableCellClass(index, weekIndex, true),
                      "text-xs flex flex-col px-2 py-2 justify-center items-center"
                    )}
                    style={{ width: getCellWidthString(tableProperties.cellWidth) }}
                  >
                    <Typography
                      variant="p"
                      className={cn("text-slate-600 text-[11px]", isToday(date) && "font-semibold")}
                    >
                      {day}
                    </Typography>
                    <Typography
                      variant="small"
                      className={cn(
                        "text-slate-500 text-[11px] max-lg:text-[0.65rem]",
                        isToday(date) && "font-semibold"
                      )}
                    >
                      {dateStr}
                    </Typography>
                  </TableHead>
                );
              });
            })}
          </div>
        </div>
      </TableRow>
    </TableHeader>
  );
};

export default ResourceTableHeader;
