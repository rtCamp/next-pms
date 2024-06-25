import { TableCell } from "@/components/ui/table";
import { cn, floatToTime } from "@/app/lib/utils";
import { TaskCellClickProps } from "../types/timesheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CirclePlus } from "@/app/components/Icon";
interface TaskCellProps {
  date: string;
  task?: any;
  name?: string;
  parent?: string;
  description: string;
  hours: number;
  isCellDisabled?: boolean;
  showAdd?: boolean;
  classname?: string;
  employee?: string;
  onCellClick: ({
    date,
    name,
    parent,
    task,
    description,
    hours,
    employee,
  }: TaskCellClickProps) => void;
}

export function TaskCell({
  date,
  name = "",
  parent = "",
  task = "",
  description,
  hours,
  isCellDisabled = false,
  showAdd = false,
  classname = "",
  employee = "",
  onCellClick,
}: TaskCellProps) {
  const onClick = () => {
    onCellClick({ date, name, parent, task, description, hours, employee });
  };
  return (
    <TableCell
      onClick={onClick}
      key={date}
      className={cn(
        "flex w-20 justify-center flex-col max-w-20 p-0",
        `${
          isCellDisabled
            ? "text-muted-foreground hover:cursor-not-allowed "
            : "hover:cursor-pointer"
        } ${classname}`
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
      ) : showAdd && !isCellDisabled ? (
        <div className="flex bg-background h-full w-14 items-center justify-center">
          <CirclePlus />
        </div>
      ) : (
        "-"
      )}
    </TableCell>
  );
}
