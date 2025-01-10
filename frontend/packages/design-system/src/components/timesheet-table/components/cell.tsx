/**
 * External dependencies
 */
import { CircleDollarSign, CirclePlus, PencilLine } from "lucide-react";
/**
 * Internal dependencies
 */
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@design-system/components/hover-card";
import { TableCell } from "@design-system/components/table";
import Typography from "@design-system/components/typography";
import { getBgCsssForToday, cn, floatToTime, preProcessLink } from "@design-system/utils";
import { TaskDataItemProps } from "../type";

type CellOnClickProps = {
  date: string;
  hours: number;
  description: string;
  name: string;
  task: string;
  project: string;
};
type cellProps = {
  date: string;
  data: TaskDataItemProps[];
  isHoliday: boolean;
  onCellClick?: (val: CellOnClickProps) => void;
  disabled?: boolean;
  cellClassName?: string;
};

const Cell = ({ date, data, isHoliday, onCellClick, disabled, cellClassName }: cellProps) => {
  const hours = data?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
  const description =
    data
      ?.map((item) => item.description)
      .filter(Boolean)
      .join("\n")
      .trim() || "";
  const isTimeBothBillableAndNonBillable =
    data?.some((item) => !item.is_billable) && data?.some((item) => item.is_billable);
  const isTimeBillable = data?.every((item) => item.is_billable);
  const isDisabled = disabled || data?.[0]?.docstatus === 1;

  const handleClick = () => {
    if (isDisabled) return;
    const value = {
      date,
      hours,
      description: "",
      name: "",
      task: data[0].task ?? "",
      project: data[0].project ?? "",
    };
    onCellClick && onCellClick(value);
  };
  return (
    <HoverCard openDelay={1000} closeDelay={0}>
      <TableCell
        key={date}
        onClick={handleClick}
        className={cn(
          "text-center group px-2",
          isDisabled && "cursor-default",
          "hover:h-full hover:bg-slate-100 hover:cursor-pointer",
          getBgCsssForToday(date),
          cellClassName
        )}
      >
        <HoverCardTrigger className={cn(isDisabled && "cursor-default")}>
          <span className="flex flex-col items-center justify-center ">
            <Typography
              variant="p"
              className={cn(
                "text-slate-600",
                isHoliday || (isDisabled && "text-slate-400"),
                !hours && !isDisabled && "group-hover:hidden"
              )}
            >
              {hours > 0 ? floatToTime(hours || 0) : "-"}
            </Typography>

            {(isTimeBothBillableAndNonBillable || isTimeBillable) && (
              <CircleDollarSign
                className={cn(
                  "stroke-slate-500 w-4 h-4 ",
                  !isDisabled && "group-hover:hidden",
                  isTimeBillable && "stroke-success"
                )}
              />
            )}
            <PencilLine
              className={cn("text-center hidden", hours > 0 && !isDisabled && "group-hover:block")}
              size={16}
            />
            <CirclePlus className={cn("text-center hidden", !hours && !isDisabled && "group-hover:block ")} size={16} />
          </span>
        </HoverCardTrigger>
        {description && (
          <HoverCardContent className="text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
            <p dangerouslySetInnerHTML={{ __html: preProcessLink(description) }}></p>
          </HoverCardContent>
        )}
      </TableCell>
    </HoverCard>
  );
};
export default Cell;
