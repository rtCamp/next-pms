/**
 * External dependencies.
 */
import { useSelector } from "react-redux";
import { TableBody, TableCell, TableRow } from "@next-pms/design-system/components";
import { cn } from "@next-pms/design-system/utils";
import {
  ResourceTableCell,
  TableInformationCellContent,
  EmptyTableCell as ResourceEmptyTableCell,
} from "@next-pms/resource-management/components";
import { getTableCellClass, getTableCellRow, getTodayDateCellClass } from "@next-pms/resource-management/utils";

/**
 * Internal dependencies.
 */
import { RootState } from "@/store";
import { PermissionProps } from "@/store/resource_management/allocation";

/**
 * This component is responsible for rendering the empty table body.
 *
 * @returns React.FC
 */
const EmptyTableBody = () => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={15} className="h-24 text-center">
          No results
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

interface EmptyTableCellProps {
  cellClassName?: string;
  textClassName?: string;
  title?: string;
  onCellClick?: () => void;
}

/**
 * This component is responsible for rendering the empty table cell.
 *
 * @param props.cellClassName class of the given cell.
 * @param props.textClassName class of the given cell text.
 * @param props.title title of the given cell.
 * @param props.onCellClick on cell click event for cell based on this will decide where to show + icon on hover or not.
 * @returns React.FC
 */
const EmptyTableCell = ({ cellClassName, title, textClassName, onCellClick }: EmptyTableCellProps) => {
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  if (!onCellClick || !resourceAllocationPermission.write) {
    return (
      <ResourceTableCell
        type="default"
        cellClassName={cellClassName}
        cellTypographyClassName={textClassName}
        value="-"
      />
    );
  }

  if (onCellClick) {
    return (
      <ResourceEmptyTableCell
        cellClassName={cellClassName}
        title={title}
        textClassName={textClassName}
        onCellClick={onCellClick}
      />
    );
  }

  return (
    <ResourceTableCell type="default" cellClassName={cellClassName} cellTypographyClassName={textClassName} value="-" />
  );
};

/**
 * This component is responsible for rendering the empty row.
 *
 * @param props.dates the dates object which contains the list of dates.
 * @returns React.FC
 */
const EmptyRow = ({ dates }: { dates: string[] }) => {
  return (
    <TableRow className={cn(getTableCellRow())}>
      <TableInformationCellContent />
      {dates.map((date: string, index: number) => {
        return (
          <ResourceTableCell
            key={date}
            type="default"
            cellClassName={(getTableCellClass(index, 0), getTodayDateCellClass(date))}
            value="-"
          />
        );
      })}
    </TableRow>
  );
};

export { EmptyRow, EmptyTableBody, EmptyTableCell };
