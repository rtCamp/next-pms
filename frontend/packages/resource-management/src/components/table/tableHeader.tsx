/**
 * External dependencies.
 */
import { LegacyRef } from "react";
import { TableHead, TableHeader, TableRow, Typography } from "@next-pms/design-system/components";
import { prettyDate, getUTCDateTime } from "@next-pms/design-system/date";
import { isToday } from "date-fns";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { DateProps, ResourceTableHeaderProps } from "./types";
import { TableContext } from "../../store";
import { mergeClassNames, getTableCellClass } from "../../utils";

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
  const { tableProperties } = useContextSelector(TableContext, (value) => value.state);
  const { getCellWidthString } = useContextSelector(TableContext, (value) => value.actions);

  return (
    <TableHeader className="border-t-0 sticky top-0 z-30">
      <TableRow className="flex items-center flex-shrink-0">
        <TableHead
          className={mergeClassNames(
            "flex items-center sticky left-0 bg-slate-50 dark:bg-muted h-[81px] w-full z-30 border-r border-gray-300"
          )}
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
                  className={mergeClassNames(
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
      className={mergeClassNames(
        getTableCellClass(index, weekIndex),
        "text-xs flex flex-col px-2 py-2 justify-center items-center"
      )}
      style={style}
      ref={date == dateToAddHeaderRef ? cellHeaderRef : null}
    >
      <Typography
        variant="p"
        className={mergeClassNames(
          "text-slate-600 text-[11px] dark:text-primary/80",
          isToday(getUTCDateTime(date)) && "font-semibold dark:text-primary"
        )}
      >
        {day}
      </Typography>
      <Typography
        variant="small"
        className={mergeClassNames(
          "text-slate-500 text-[11px] max-lg:text-[0.65rem] dark:text-primary/60",
          isToday(getUTCDateTime(date)) && "font-semibold dark:text-primary"
        )}
      >
        {dateStr}
      </Typography>
    </TableHead>
  );
};

export { ResourceTableHeader };
