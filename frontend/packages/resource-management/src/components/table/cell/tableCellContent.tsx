/**
 * External dependencies.
 */
import React from "react";
import { Typography } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { mergeClassNames, getFilterValue } from "../../../utils";

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

export { TableCellContent };
