/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  TaskStatus,
  ComboBox,
  Spinner,
  Typography,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  useToast,
} from "@next-pms/design-system/components";
import { getTodayDate, getFormatedDate, prettyDate } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { cn, parseFrappeErrorMsg } from "@/lib/utils";

type Employee = {
  employee: string;
  employee_name: string;
  image: string;
  total_hour: number;
};
type LogData = {
  employee: string;
  hours: number;
  description: string[];
};
type TaskLogProps = {
  task: string;
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
};

export const TaskLog = ({ task, isOpen, onOpenChange }: TaskLogProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(getFormatedDate(addDays(getTodayDate(), -15)));
  const endDate = getTodayDate();
  const [selectedMap, setSelectedMap] = useState<string>("15");
  const { data, isLoading, error } = useFrappeGetCall("next_pms.timesheet.api.task.get_task", {
    task: task,
    start_date: startDate,
    end_date: endDate,
  });
  const dateMap = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 15 days", value: "15" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 60 days", value: "60" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 180 days", value: "180" },
    { label: "Last 365 days", value: "365" },
  ];
  const {
    data: logs,
    isLoading: isLogLoading,
    error: logError,
  } = useFrappeGetCall("next_pms.timesheet.api.task.get_task_log", {
    task: task,
    start_date: startDate,
    end_date: endDate,
  });

  const setDefault = () => {
    setSelectedMap("15");
    setStartDate(getFormatedDate(addDays(getTodayDate(), -15)));
  };

  useEffect(() => {
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    if (logError) {
      const err = parseFrappeErrorMsg(logError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, logError]);

  return (
    <Dialog open={isOpen} modal={true} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby=""
        aria-description=""
        className="sm:max-w-2xl gap-2 overflow-hidden flex flex-col"
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <DialogHeader className="space-y-0">
              <DialogTitle title={data?.message.subject} className="flex items-center gap-x-2">
                {data?.message.gh_link && data?.message.gh_link.length > 0 ? (
                  <a href={data?.message.gh_link} target="_blank" className="hover:underline">
                    <Typography variant="h2" className="max-w-sm truncate" title={data?.message.subject}>
                      {data?.message.subject}
                    </Typography>
                  </a>
                ) : (
                  <Typography variant="h2" className="max-w-sm truncate" title={data?.message.subject}>
                    {data?.message.subject}
                  </Typography>
                )}

                <TaskStatus status={data?.message.status} />
              </DialogTitle>
              <div className="flex justify-between max-w-full">
                <div className="flex gap-x-2 w-4/5 overflow-hidden">
                  <Typography as="span" className="flex items-center gap-x-1 shrink-0">
                    Time:
                    <Typography
                      variant="p"
                      className={cn(
                        "font-semibold",
                        data?.message.actual_time > data?.message.expected_time && "text-destructive",
                        data?.message.actual_time < data?.message.expected_time && "text-success"
                      )}
                    >
                      {floatToTime(data?.message.actual_time)}h
                    </Typography>
                  </Typography>

                  <Typography as="span" className="flex items-center gap-x-1 shrink-0">
                    Estimate:
                    <Typography variant="p" className={cn("font-semibold")}>
                      {floatToTime(data?.message.expected_time)}h
                    </Typography>
                  </Typography>
                  <Typography as="span" className="flex items-center gap-x-1">
                    Project:
                    <Typography
                      variant="p"
                      className="font-semibold max-w-64 truncate"
                      title={data?.message.project_name}
                    >
                      {data?.message.project_name}
                    </Typography>
                  </Typography>
                </div>
                <div className="w-1/5">
                  <ComboBox
                    className="float-right w-24 p-2"
                    data={dateMap}
                    value={[selectedMap]}
                    label="Date Range"
                    shouldFilter
                    onSelect={(value: string | string[]) => {
                      if (typeof value === "string") {
                        setSelectedMap(value);
                        const date = value;
                        setStartDate(getFormatedDate(addDays(getTodayDate(), -parseInt(date))));
                      } else {
                        if (value.length === 0) {
                          setDefault();
                        } else {
                          setSelectedMap(value[0]);
                          const date = value[0];
                          setStartDate(getFormatedDate(addDays(getTodayDate(), -parseInt(date))));
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </DialogHeader>
            <Separator />
            {data?.message.worked_by?.length != 0 && (
              <>
                <section id="worked_by w-full bg-red-500">
                  <div className="flex gap-x-4 overflow-x-auto no-scrollbar">
                    {data?.message.worked_by?.map((employee: Employee) => (
                      <div key={employee.employee} className="flex items-center gap-x-2 shrink-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={employee.image} alt={employee.employee_name} />
                          <AvatarFallback>
                            <Typography variant="p" className="font-semibold">
                              {employee.employee_name[0]}
                            </Typography>
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <Typography variant="p">{employee.employee_name}</Typography>
                          <Typography variant="p" className="font-semibold">
                            {floatToTime(employee.total_hour)}h
                          </Typography>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {isLogLoading ? (
              <Spinner />
            ) : (
              <>
                <section id="log" className="max-h-96 overflow-y-auto no-scrollbar flex flex-col gap-3">
                  <>
                    {logs &&
                      Object.entries(logs.message as Record<string, LogData[]>).map(([key, value], index: number) => {
                        return (
                          <div key={index}>
                            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                            {value.map((log: LogData, i: number) => {
                              const employee = data?.message.worked_by?.find(
                                (emp: Employee) => emp.employee === log.employee
                              );
                              return (
                                <div className="border-b border-dashed p-2 bg-gray-50 ">
                                  <div className="flex justify-between w-full">
                                    <span className="flex gap-x-2 items-start">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={employee?.image} alt={employee?.employee_name} />
                                        <AvatarFallback>
                                          <Typography variant="p" className="font-semibold">
                                            {employee?.employee_name[0]}
                                          </Typography>
                                        </AvatarFallback>
                                      </Avatar>
                                      <Typography variant="p">{employee?.employee_name}</Typography>
                                      <Typography variant="p">{prettyDate(key).date}</Typography>
                                    </span>
                                    <Typography variant="p">{floatToTime(log.hours)}h</Typography>
                                  </div>
                                  {log.description.map((description: string) => (
                                    <Typography
                                      key={description}
                                      variant="p"
                                      className="pl-8 py-1 rounded pb-0 w-full overflow-x-auto"
                                    >
                                      {description}
                                    </Typography>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </>
                </section>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
