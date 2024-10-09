import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Separator } from "@/app/components/ui/separator";
import { Spinner } from "@/app/components/spinner";
import { TaskStatus } from "./taskStatus";
import { Typography } from "@/app/components/typography";
import { cn, getTodayDate, getFormatedDate, floatToTime, prettyDate, parseFrappeErrorMsg } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { setSelectedTask } from "@/store/task";
import { useEffect, useState } from "react";
import { addDays } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { ComboxBox } from "@/app/components/comboBox";
import { useToast } from "@/app/components/ui/use-toast";
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
export const TaskLog = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(getFormatedDate(addDays(getTodayDate(), -7)));
  const endDate = getTodayDate();
  const [selectedMap, setSelectedMap] = useState<string[]>(["7"]);
  const task = useSelector((state: RootState) => state.task);
  const { data, isLoading, error } = useFrappeGetCall("frappe_pms.timesheet.api.task.get_task", {
    task: task.selectedTask,
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
  } = useFrappeGetCall("frappe_pms.timesheet.api.task.get_task_log", {
    task: task.selectedTask,
    start_date: startDate,
    end_date: endDate,
  });
  const handleClose = () => {
    const data = {
      isOpen: false,
      task: "",
    };
    dispatch(setSelectedTask(data));
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
    <Dialog open={task.isTaskLogDialogBoxOpen} modal={true} onOpenChange={handleClose}>
      <DialogContent aria-describedby="" aria-description="" className="sm:max-w-2xl overflow-auto gap-2">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle title={data?.message.subject} className="flex items-center gap-x-2">
                <Typography variant="h2" className="max-w-sm truncate" title={data?.message.subject}>
                  {data?.message.subject}
                </Typography>
                <TaskStatus status={data?.message.status} />
              </DialogTitle>
              <div className="flex gap-x-2">
                <Typography as="p" className="flex items-center gap-x-1">
                  Time:
                  <Typography
                    variant="p"
                    className={cn(
                      "font-semibold",
                      data?.message.actual_time > data?.message.expected_time && "text-destructive",
                    )}
                  >
                    {data?.message.actual_time}h
                  </Typography>
                </Typography>

                <Typography as="p" className="flex items-center gap-x-1">
                  Estimate:
                  <Typography variant="p" className={cn("font-semibold")}>
                    {data?.message.expected_time}h
                  </Typography>
                </Typography>
                <Typography as="p" className="flex items-center gap-x-1">
                  Project:
                  <Typography
                    variant="p"
                    className="font-semibold max-w-xs truncate"
                    title={data?.message.project_name}
                  >
                    {data?.message.project_name}
                  </Typography>
                </Typography>
              </div>
            </DialogHeader>
            <Separator />
            {data?.message.worked_by?.length != 0 && (
              <>
                <section id="worked_by">
                  <div className="flex gap-x-2 max-w-md overflow-x-auto">
                    {data?.message.worked_by?.map((employee: Employee) => (
                      <div key={employee.employee} className="flex items-center gap-x-2">
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
                            {employee.total_hour}h
                          </Typography>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
              </>
            )}
            <span>
              <ComboxBox
                className="float-right  p-2 max-w-24"
                data={dateMap}
                value={selectedMap}
                label="Date Range"
                shouldFilter
                onSelect={(value: string | string[]) => {
                  if (typeof value === "string") {
                    setSelectedMap([value]);
                    const date = value;
                    setStartDate(getFormatedDate(addDays(getTodayDate(), -parseInt(date))));
                  } else {
                    if (value.length === 0) {
                      setSelectedMap([dateMap[0].value]);
                      const date = dateMap[0].value;
                      setStartDate(getFormatedDate(addDays(getTodayDate(), -parseInt(date))));
                      return;
                    }
                    setSelectedMap([value[0]]);
                    const date = value[0];
                    setStartDate(getFormatedDate(addDays(getTodayDate(), -parseInt(date))));
                  }
                }}
              />
            </span>
            {isLogLoading ? (
              <Spinner />
            ) : (
              <>
                <section id="log" className="max-h-96 overflow-y-auto">
                  <>
                    {logs &&
                      Object.entries(logs.message as Record<string, LogData[]>).map(([key, value], index: number) => {
                        return (
                          <div key={index} className="py-1">
                            {value.map((log: LogData, i: number) => {
                              const employee = data?.message.worked_by?.find(
                                (emp: Employee) => emp.employee === log.employee,
                              );

                              return (
                                <Accordion key={`${log.employee}-${i}-${index}`} type="multiple">
                                  <AccordionItem value={`${log.employee}-${i}-${index}`}>
                                    <AccordionTrigger className="hover:no-underline py-1">
                                      <div className="flex justify-between w-full">
                                        <span className="flex gap-x-2 items-center">
                                          <Avatar className="w-6 h-6">
                                            <AvatarImage src={employee?.image} alt={employee?.employee_name} />
                                            <AvatarFallback>
                                              <Typography variant="p" className="font-semibold">
                                                {employee?.employee_name[0]}
                                              </Typography>
                                            </AvatarFallback>
                                          </Avatar>
                                          <Typography variant="p">{employee?.employee_name}</Typography>
                                          <Typography variant="small">{prettyDate(key).date}</Typography>
                                        </span>
                                        <Typography variant="p">{floatToTime(log.hours, 1, 1)}</Typography>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-8 pb-0">
                                      {log.description.map((description: string) => (
                                        <Typography key={description} variant="p">
                                          {description}
                                        </Typography>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
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
