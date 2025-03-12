/**
 * External dependencies.
 */
import { LegacyRef, useContext } from "react";
import { TableHead, TableHeader, TableRow, Typography } from "@next-pms/design-system/components";
import { prettyDate, getUTCDateTime } from "@next-pms/design-system/date";
import { isToday } from "date-fns";

/**
 * Internal dependencies.
 */
import { TableContext } from "../../store";
import { cn, getTableCellClass } from "../../utils";

export type DateProps = {
  startDate: string;
  endDate: string;
  key: string;
  dates: string[];
};

interface ResourceTableHeaderProps {
  dates: DateProps[];
  title: string;
  cellHeaderRef: LegacyRef<HTMLTableCellElement>;
  dateToAddHeaderRef: string;
  isLoading?: boolean;
}

/**
 * This component is used to render the table header for the resource management table.
 *
 * @param props.dates The dates list
 * @param props.title The title of Table header.
 * @param props.cellHeaderRef The reference of the cell header.
 * @param props.dateToAddHeaderRef The reference of the date to add header.
 * @returns React.FC
 */
const ResourceTableHeader = ({
  dates,
  title,
  cellHeaderRef,
  dateToAddHeaderRef,
  isLoading,
}: ResourceTableHeaderProps) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);

  return (
    <TableHeader className="border-t-0 sticky top-0 z-30">
      <TableRow className="flex items-center flex-shrink-0">
        <TableHead
          className={cn("flex items-center")}
          style={{ width: getCellWidthString(tableProperties.firstCellWidth) }}
        >
          {title}
        </TableHead>
        <div className="flex flex-col">
          <div className="flex items-center">
            {dates.map((date: DateProps, weekIndex: number) => {
              return (
                <Typography
                  key={weekIndex}
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
                return (
                  <TableHeaderCell
                    date={date}
                    key={date}
                    index={index}
                    isLoading={isLoading}
                    weekIndex={weekIndex}
                    style={{ width: getCellWidthString(tableProperties.cellWidth) }}
                    cellHeaderRef={cellHeaderRef}
                    dateToAddHeaderRef={dateToAddHeaderRef}
                  />
                );
              });
            })}
          </div>
        </div>
      </TableRow>
    </TableHeader>
  );
};

/**
 * The single header cell for the table which show date and day names in the header.
 *
 * @returns
 */
const TableHeaderCell = ({
  date,
  index,
  weekIndex,
  cellHeaderRef,
  dateToAddHeaderRef,
  style,
}: {
  date: string;
  isLoading?: boolean;
  index: number;
  weekIndex: number;
  cellHeaderRef: LegacyRef<HTMLTableCellElement>;
  dateToAddHeaderRef: string;
  style: React.CSSProperties;
}) => {
  const { date: dateStr, day } = prettyDate(date);

  return (
    <TableHead
      key={date}
      className={cn(getTableCellClass(index, weekIndex), "text-xs flex flex-col px-2 py-2 justify-center items-center")}
      style={style}
      ref={date == dateToAddHeaderRef ? cellHeaderRef : null}
    >
      <Typography
        variant="p"
        className={cn("text-slate-600 text-[11px]", isToday(getUTCDateTime(date)) && "font-semibold")}
      >
        {day}
      </Typography>
      <Typography
        variant="small"
        className={cn(
          "text-slate-500 text-[11px] max-lg:text-[0.65rem]",
          isToday(getUTCDateTime(date)) && "font-semibold"
        )}
      >
        {dateStr}
      </Typography>
    </TableHead>
  );
};

export { ResourceTableHeader };
