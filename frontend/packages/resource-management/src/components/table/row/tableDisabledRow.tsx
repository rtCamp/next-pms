/**
 * External dependencies.
 */
import { TableRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { mergeClassNames, getTableCellClass, getTodayDateCellClass } from "../../../utils";
import { ResourceTableCell, TableInformationCellContent } from "../cell";

/**
 * Renders the disabled row for the resource management table.
 *
 * @param dates The dates list
 * @param data The data to render, can be used to handle to show any data instead of - in emptycell.
 * @param className The class name for the row.
 * @param informationCellClassName The class name for the first cell.
 * @param cellClassName The class name for cell.
 * @returns React.FC
 */
const TableDisabledRow = ({
  dates,
  data,
  className,
  informationCellClassName,
  cellClassName,
}: {
  dates: string[];
  data?: Record<string, number>;
  className?: string;
  informationCellClassName?: string;
  cellClassName?: string;
}) => {
  return (
    <TableRow className={mergeClassNames("flex items-center w-full border-0", className)}>
      <TableInformationCellContent
        cellClassName={mergeClassNames("pl-12", informationCellClassName)}
        value="Time Off"
      />

      {dates.map((date: string, index: number) => {
        return (
          <ResourceTableCell
            type="default"
            key={date}
            cellClassName={mergeClassNames(
              getTableCellClass(index, 0),
              "bg-gray-200 dark:bg-muted",
              getTodayDateCellClass(date),
              cellClassName
            )}
            value={data && data[date] ? data[date] : "-"}
          />
        );
      })}
    </TableRow>
  );
};

export { TableDisabledRow };
