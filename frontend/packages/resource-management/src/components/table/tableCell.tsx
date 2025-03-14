/**
 * External dependencies.
 */
import React, { useContext, useState } from "react";
import {
  HoverCardContent,
  Typography,
  TableCell,
  HoverCard,
  HoverCardTrigger,
} from "@next-pms/design-system/components";
import { TableContext } from "@next-pms/resource-management/store";
import { CirclePlus } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { EmptyTableCellProps, ResourceTableProps } from "./types";
import { mergeClassNames, getFilterValue } from "../../utils";

/**
 * This component is responsible to render a table cell based on it type dynamically.
 *
 * @param props.type The type of the cell.
 * @param props.cellTypographyClassName  The class name for cell typography.
 * @param props.cellClassName  The class name for cell.
 * @param props.CellContent  The cell content.
 * @param props.CustomHoverCardContent  The custom hover card content whihc can be render on cell hover.
 * @param props.title  The title of the cell.
 * @param props.ref  The reference of the cell.
 * @param props.value  The value of the cell.
 * @param props.style  The style of the cell.
 * @returns React.FC
 */
const ResourceTableCell = ({
  type,
  title,
  CustomHoverCardContent,
  cellTypographyClassName,
  cellClassName,
  CellContent,
  ref,
  value,
  style,
}: ResourceTableProps) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);

  const mergeCellClassName = mergeClassNames(
    "cursor-pointer text-xs flex px-2 py-2 w-16 justify-center items-center",
    cellClassName
  );

  const inlineStyle = { width: getCellWidthString(tableProperties.cellWidth), ...style };

  if (type == "hovercard") {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild className="w-full h-full cursor-pointer text-center hover:bg-gray-200">
          <TableCell ref={ref} className={mergeCellClassName} style={inlineStyle}>
            {CellContent && <CellContent />}

            <TableCellContent title={title} className={cellTypographyClassName} value={value} />
          </TableCell>
        </HoverCardTrigger>
        <HoverCardContent className="min-w-64 max-w-96 w-fit">
          {CustomHoverCardContent && <CustomHoverCardContent />}
        </HoverCardContent>
      </HoverCard>
    );
  }

  if (type == "default") {
    return (
      <TableCell ref={ref} className={mergeCellClassName} style={inlineStyle}>
        {CellContent && <CellContent />}
        <TableCellContent title={title} className={cellTypographyClassName} value={value} />
      </TableCell>
    );
  }
};

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

/**
 * This component is responsible to display the cell text contents.
 *
 * @param props.value The value to be displayed in the cell.
 * @param props.TextComponet The text component to be displayed in the cell.
 * @param props.className The class name for the cell.
 * @param props.title The title of the cell.
 * @returns React.FC
 */
const TableCellContent = ({
  value,
  TextComponet,
  className,
  title,
}: {
  value?: string | number | boolean;
  TextComponet?: React.FC | undefined;
  className?: string | undefined;
  title?: string;
}) => {
  return (
    <Typography
      className={mergeClassNames("text-gray-800 text-[11px] h-6 flex items-center", className)}
      variant="p"
      title={title}
    >
      {!value && !TextComponet && " "}
      {getFilterValue(value)}
      {TextComponet && <TextComponet />}
    </Typography>
  );
};

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

  return (
    <TableCell
      className={mergeClassNames(
        "cursor-pointer text-xs flex px-2 py-2 w-16 justify-center items-center",
        cellClassName
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onCellClick}
      title={title}
    >
      <TableCellContent
        className={textClassName}
        TextComponet={
          isHovered
            ? () => <CirclePlus className={mergeClassNames("text-center cursor-pointer")} size={4} />
            : () => <>{"-"}</>
        }
      />
    </TableCell>
  );
};

export { ResourceTableCell, TableCellContent, TableInformationCellContent, EmptyTableCell };
