import { TableCell } from "@/components/ui/table";
import { cn, floatToTime } from "@/app/lib/utils";
import { TaskCellClickProps } from "../types/timesheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskCellProps {
  date: string;
  task?: any;
  name?: string;
  parent?: string;
  description: string;
  hours: number;
  isCellDisabled?: boolean;
  onCellClick: ({
    date,
    name,
    parent,
    task,
    description,
    hours,
  }: TaskCellClickProps) => void;
}

export function TaskCell({
  date,
  name = "",
  parent = "",
  task = "",
  description,
  hours,
  isCellDisabled,
  onCellClick,
}: TaskCellProps) {
  const onClick = () => {
    onCellClick({ date, name, parent, task, description, hours });
  };
  return (
    <TableCell
      onClick={onClick}
      key={date}
      className={cn(
        "flex w-full justify-center flex-col max-w-[90px] p-0",
        `${
          isCellDisabled
            ? "text-muted-foreground hover:cursor-not-allowed "
            : "hover:cursor-pointer"
        }`
      )}
    >
      {hours ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full flex  items-center">
                {floatToTime(hours)}
              </div>
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </>
      ) : (
        "-"
      )}
    </TableCell>
  );
}
