import { Typography } from "@/app/components/typography";
import { TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { getTableCellClass } from "../utils/helper";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
import { CirclePlus } from "lucide-react";
import { useState } from "react";

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
  onCellClick?: () => void;
}

const EmptyTableCell = ({ cellClassName, textClassName, onCellClick }: EmptyTableCellProps) => {
  const [isHovered, setIsHovered] = useState(false);

  if (onCellClick) {
    return (
      <TableCell
        className={cn("cursor-pointer", cellClassName)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onCellClick}
      >
        <Typography className={cn("text-gray-800 text-xs flex items-center", textClassName)} variant="p">
          {isHovered ? <CirclePlus className={cn("text-center")} size={4} /> : "-"}
        </Typography>
      </TableCell>
    );
  }

  return <TableCell className={className}>{"-"}</TableCell>;
};

const EmptyRow = ({ dates }: { dates: string[] }) => {
  return (
    <TableRow className="flex items-center w-full border-0">
      <TableCell className="w-[24rem] overflow-hidden pl-12">
        <Typography variant="p" className="flex gap-x-2 items-center font-normal hover:underline w-full">
          {" "}
        </Typography>
        {/* <Typography variant="small" className="text-slate-500 truncate">
        {taskData.project_name}
      </Typography> */}
      </TableCell>
      {dates.map((date: string, index: number) => {
        return (
          <TableCell className={getTableCellClass(index)} key={date}>
            -
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export { EmptyTableBody, EmptyRow, EmptyTableCell };
