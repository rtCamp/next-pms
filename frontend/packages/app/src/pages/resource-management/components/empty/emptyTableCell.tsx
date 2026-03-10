/**
 * External dependencies.
 */
import { ResourceTableCell, EmptyTableCell as ResourceEmptyTableCell } from "@next-pms/resource-management/components";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { EmptyTableCellProps } from "./types";
import { ResourceFormContext } from "../../store/resourceFormContext";

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
  const resourceAllocationPermission = useContextSelector(ResourceFormContext, (value) => value.state.permission);

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

export { EmptyTableCell };
