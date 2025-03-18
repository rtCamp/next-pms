/**
 * External dependencies.
 */
import React, { useContext } from "react";
import { Typography, TableCell } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { TableContext } from "../../../store";
import { mergeClassNames, getFilterValue } from "../../../utils";

/**
 * This component is responsible to render the cell content based on feat to handle onClick event of the table.
 *
 * @param props.value The value of the cell.
 * @param props.cellClassName The class for cell.
 * @param props.CellComponet The cell component.
 * @param props.cellTypographyClassName The class name for cell typography.
 * @param props.onClick The onClick event for cell.
 * @returns React.FC
 */
const TableInformationCellContent = ({
  value,
  cellClassName,
  CellComponet,
  cellTypographyClassName,
  cellRef,
  onClick,
}: {
  value?: string;
  cellClassName?: string;
  CellComponet?: React.FC | undefined;
  cellTypographyClassName?: string;
  cellRef?: React.RefObject<HTMLTableCellElement>;
  onClick?: () => void;
}) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);

  return (
    <TableCell
      className={mergeClassNames("overflow-hidden sticky left-0 align-super h-full", cellClassName)}
      onClick={onClick}
      style={{ width: getCellWidthString(tableProperties.firstCellWidth) }}
      ref={cellRef}
    >
      <Typography
        variant="p"
        className={mergeClassNames(
          "flex gap-x-2 items-center font-normal text-[13px] hover:underline w-full cursor-pointer",
          cellTypographyClassName
        )}
        title={value}
      >
        {!value && !CellComponet && " "}
        {CellComponet && <CellComponet />}
        {getFilterValue(value)}
      </Typography>
    </TableCell>
  );
};

export { TableInformationCellContent };
