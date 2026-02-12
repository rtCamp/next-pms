/**
 * External dependencies.
 */
import { TableRow } from "@next-pms/design-system/components";
import { mergeClassNames } from "@next-pms/design-system/utils";
import {
  ResourceTableCell,
  TableInformationCellContent,
} from "@next-pms/resource-management/components";
import {
  getTableCellClass,
  getTableCellRow,
  getTodayDateCellClass,
} from "@next-pms/resource-management/utils";

/**
 * This component is responsible for rendering the empty row.
 *
 * @param props.dates the dates object which contains the list of dates.
 * @returns React.FC
 */
const EmptyRow = ({ dates }: { dates: string[] }) => {
  return (
    <TableRow className={mergeClassNames(getTableCellRow())}>
      <TableInformationCellContent />
      {dates.map((date: string, index: number) => {
        return (
          <ResourceTableCell
            key={date}
            type="default"
            cellClassName={
              (getTableCellClass(index, 0), getTodayDateCellClass(date))
            }
            value="-"
          />
        );
      })}
    </TableRow>
  );
};

export { EmptyRow };
