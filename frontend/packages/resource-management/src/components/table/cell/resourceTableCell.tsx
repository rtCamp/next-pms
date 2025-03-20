/**
 * External dependencies.
 */
import { HoverCardContent, TableCell, HoverCard, HoverCardTrigger } from "@next-pms/design-system/components";
import { TableContext } from "@next-pms/resource-management/store";
import { useContextSelector } from "use-context-selector";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../../utils";
import type { ResourceTableProps } from "../types";
import { TableCellContent } from "./tableCellContent";

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
  const { tableProperties, getCellWidthString } = useContextSelector(TableContext, (value) => value);

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

export { ResourceTableCell };
