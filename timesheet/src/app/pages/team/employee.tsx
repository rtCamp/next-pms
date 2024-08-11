import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Spinner } from "@/app/components/spinner";
import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn, floatToTime, getDateFromDateAndTime } from "@/lib/utils";
import { PencilLine, CirclePlus, CircleDollarSign } from "lucide-react";
import { useState } from "react";
import { TaskDataProps, TaskDataItemProps, LeaveProps } from "@/types/timesheet";

interface EmployeeProps {
  employee: string;
}

export const Employee = ({ employee }: EmployeeProps) => {
  const teamState = useSelector((state: RootState) => state.team);
  const { data, isLoading } = useFrappeGetCall("timesheet_enhancer.api.team.get_timesheet_for_employee", {
    employee: employee,
    date: teamState.weekDate,
  });
  if (isLoading) {
    return <Spinner />;
  }
  const timesheetData = data?.message.data[Object.keys(data?.message.data)[0]];
  return (
    <div>
      <Table>
        <TableBody>
          {timesheetData.leaves.length > 0 && <LeaveRow dates={timesheetData.dates} leaves={timesheetData.leaves} />}
          {Object.keys(timesheetData.tasks).length == 0 && (
            <EmptyRow dates={timesheetData.dates} holidays={timesheetData.holidays} />
          )}
          {Object.keys(timesheetData.tasks).length > 0 &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //   @ts-ignore
            Object.entries(timesheetData.tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200 flex w-full">
                  <TableCell className="max-w-md w-full">
                    <Typography variant="p" className="text-slate-800">
                      {task}
                    </Typography>
                    <Typography variant="small" className="text-slate-500">
                      {taskData.project_name}
                    </Typography>
                  </TableCell>
                  {timesheetData.dates.map((date: string) => {
                    const data = taskData.data.find(
                      (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                    );
                    if (data && data.hours) {
                      totalHours += data.hours;
                    }
                    const isHoliday = timesheetData.holidays.includes(date);
                    return <Cell date={date} data={data} isHoliday={isHoliday} disabled />;
                  })}
                  <TableCell className={ cn("max-w-24 w-full flex justify-between items-center",!taskData.is_billable && "justify-end")}>
                    {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                    <Typography variant="p" className="text-slate-800 font-medium">
                      {floatToTime(totalHours)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
};

export const EmptyRow = ({
  dates,
  holidays,
  onCellClick,
}: {
  dates: string[];
  holidays: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
}) => {
  return (
    <TableRow className="flex">
      <TableCell className="w-full max-w-md">
        <Typography variant="p" className="text-destructive">
          Add Task
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const isHoliday = holidays.includes(date);
        const value = {
          date,
          hours: "",
          description: "",
          isUpdate: false,
          name: "",
          parent: "",
          task: "",
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //   @ts-ignore
        return <Cell date={date} data={value} isHoliday={isHoliday} onCellClick={onCellClick} disabled />;
      })}
      <TableCell className="w-full max-w-24 text-left"></TableCell>
    </TableRow>
  );
};

const Cell = ({
  date,
  data,
  isHoliday,
  onCellClick,
  disabled,
}: {
  date: string;
  data: TaskDataItemProps | undefined;
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDisabled = disabled || data?.docstatus === 1;
  const handleClick = () => {
    if (isDisabled || !data) return;
    const value = {
      date: date,
      hours: data?.hours ?? "",
      description: data?.description ?? "",
      isUpdate: data?.hours > 0 ? true : false,
      name: data?.name ?? "",
      parent: data?.parent ?? "",
      task: data?.task ?? "",
    };

    onCellClick && onCellClick(value);
  };
  const onMouseEnter: React.MouseEventHandler<HTMLTableCellElement> = () => {
    if (isDisabled) return;
    setIsHovered(true);
  };
  const onMouseLeave: React.MouseEventHandler<HTMLTableCellElement> = () => {
    if (isDisabled) return;
    setIsHovered(false);
  };

  return (
    <Tooltip>
      <TableCell
        key={date}
        onMouseEnter={onMouseEnter}
        onClick={handleClick}
        onMouseLeave={onMouseLeave}
        className={cn(
          "max-w-20 w-full text-center",
          isDisabled && "cursor-default",
          isHovered && "bg-slate-100 text-center cursor-pointer"
        )}
      >
        <TooltipTrigger className={cn("h-full", isDisabled && "cursor-default")}>
          {!isHovered && (
            <Typography variant="p" className={cn("text-slate-600", isHoliday || (isDisabled && "text-slate-400"))}>
              {data?.hours ? floatToTime(data?.hours || 0) : "-"}
            </Typography>
          )}
          {isHovered && data?.hours && data?.hours > 0 && <PencilLine className="text-center" size={16} />}
          {isHovered && !data?.hours && <CirclePlus className="text-center" size={16} />}
        </TooltipTrigger>
        {data?.description && <TooltipContent className="whitespace-pre text-left max-w-72 text-wrap">{data?.description}</TooltipContent>}
      </TableCell>
    </Tooltip>
  );
};

const LeaveRow = ({ leaves, dates }: { leaves: Array<LeaveProps>; dates: string[] }) => {
  let total_hours = 0;
  return (
    <TableRow className="flex">
      <TableCell className="w-full min-w-md text-left max-w-md">
        <Typography variant="p" className="text-slate-800 w-full">
          Time Off
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const data = leaves.find((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        const hour = data?.half_day ? 4 : 8;
        if (data) {
          total_hours += hour;
        }
        return (
          <TableCell key={date} className="max-w-20 min-w-20 w-full text-center">
            <Typography variant="p" className="text-slate-600">
              {data ? floatToTime(hour) : "-"}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell className="max-w-24 w-full items-center justify-end flex">
        <Typography variant="p" className="text-slate-800 font-medium">
          {floatToTime(total_hours)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
