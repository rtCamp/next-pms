/**
 * External dependencies.
 */
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps } from "@/store/resource_management/allocation";

import { getTableCellClass, getTableCellRow } from "../utils/helper";
import { ResourceTableCell, TableCellContent, TableInformationCellContent } from "./TableCell";

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
  const [isHovered, setIsHovered] = useState(false);
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
      <TableCell
        className={cn("cursor-pointer", cellClassName)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onCellClick}
        title={title}
      >
        <TableCellContent
          className={textClassName}
          TextComponet={
            isHovered ? () => <CirclePlus className={cn("text-center cursor-pointer")} size={4} /> : () => <>{"-"}</>
          }
        />
      </TableCell>
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
        return <ResourceTableCell key={date} type="default" cellClassName={getTableCellClass(index)} value="-" />;
      })}
    </TableRow>
  );
};

export { EmptyRow, EmptyTableBody, EmptyTableCell };
