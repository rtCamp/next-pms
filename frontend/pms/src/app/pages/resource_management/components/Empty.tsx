import { Typography } from "@/app/components/typography";
import { TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { getTableCellClass, getTableCellRow } from "../utils/helper";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import { ResourceTableCell, TableCellContent, TableInformationCellContent } from "./TableCell";
import { PermissionProps } from "@/store/resource_management/allocation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

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

export { EmptyTableBody, EmptyRow, EmptyTableCell };
