import { cn } from "@/lib/utils";
import { TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import React from "react";
import { HoverCard, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { HoverCardContent } from "@/app/components/ui/hover-card";
import { EmptyTableCell } from "./Empty";
import { getFilterValue } from "../utils/helper";

interface ResourceTableProps {
  type: "hovercard" | "empty" | "default";
  CustomHoverCardContent?: React.FC;
  cellTypographyClassName?: string;
  cellClassName?: string;
  CellContent?: React.FC;
  title?: string;
  ref?: React.RefObject<HTMLTableCellElement>;
  value: number | string | boolean | "";
  style?: React.CSSProperties;
  onCellClick?: () => void;
}

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
  onCellClick,
}: ResourceTableProps) => {
  const mergeCellClassName = cn("text-xs flex px-2 py-2 w-16 justify-center items-center", cellClassName);

  if (type == "hovercard") {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild className="w-full h-full cursor-pointer text-center hover:bg-gray-200">
          <TableCell ref={ref} className={mergeCellClassName} style={style}>
            {CellContent && <CellContent />}

            <TableCellContent title={title} className={cellTypographyClassName} value={value} />
          </TableCell>
        </HoverCardTrigger>
        <HoverCardContent>{CustomHoverCardContent && <CustomHoverCardContent />}</HoverCardContent>
      </HoverCard>
    );
  }

  if (type == "empty") {
    return (
      <EmptyTableCell title={title} cellClassName={mergeCellClassName} textClassName="h-6" onCellClick={onCellClick} />
    );
  }

  if (type == "default") {
    return (
      <TableCell ref={ref} className={mergeCellClassName} style={style}>
        {CellContent && <CellContent />}
        <TableCellContent title={title} className={cellTypographyClassName} value={value} />
      </TableCell>
    );
  }
};

const TableInformationCellContent = ({
  value,
  cellClassName,
  CellComponet,
  cellTypographyClassName,
  onClick,
}: {
  value?: string;
  cellClassName?: string;
  CellComponet?: React.FC | undefined;
  cellTypographyClassName?: string;
  onClick?: () => void;
}) => {
  return (
    <TableCell className={cn("w-[15rem] overflow-hidden pl-12", cellClassName)} onClick={onClick}>
      <Typography
        variant="p"
        className={cn(
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
    <Typography className={cn("text-gray-800 text-[11px] h-6 flex items-center", className)} variant="p" title={title}>
      {!value && !TextComponet && " "}
      {getFilterValue(value)}
      {TextComponet && <TextComponet />}
    </Typography>
  );
};

export { ResourceTableCell, TableCellContent, TableInformationCellContent };
