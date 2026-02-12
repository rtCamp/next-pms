/**
 * External dependencies.
 */
import { useState } from "react";
import { TableCell } from "@next-pms/design-system/components";
import { CirclePlus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../../utils";

import type { EmptyTableCellProps } from "../types";
import { TableCellContent } from "./tableCellContent";

/**
 * This component is responsible for rendering the empty table cell.
 *
 * @param props.cellClassName class of the given cell.
 * @param props.textClassName class of the given cell text.
 * @param props.title title of the given cell.
 * @param props.onCellClick on cell click event for cell based on this will decide where to show + icon on hover or not.
 * @returns React.FC
 */
const EmptyTableCell = ({
  cellClassName,
  title,
  textClassName,
  onCellClick,
}: EmptyTableCellProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TableCell
      className={mergeClassNames(
        "cursor-pointer text-xs flex px-2 py-2 w-16 justify-center items-center",
        cellClassName,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onCellClick}
      title={title}
    >
      <TableCellContent
        className={textClassName}
        TextComponent={
          isHovered
            ? () => (
                <CirclePlus
                  className={mergeClassNames("text-center cursor-pointer")}
                  size={4}
                />
              )
            : () => <>{"-"}</>
        }
      />
    </TableCell>
  );
};

export { EmptyTableCell };
