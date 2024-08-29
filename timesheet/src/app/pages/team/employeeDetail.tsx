// @ts-nocheck
import { Button } from "@/app/components/ui/button";
import { useParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  cn,
  getDateFromDateAndTime,
  getFormatedDate,
  getTodayDate,
  parseFrappeErrorMsg,
  prettyDate,
  calculateExtendedWorkingHour,
  deBounce,
  floatToTime,
  preProcessLink,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/ui/use-toast";
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import TimesheetTable from "@/app/components/timesheetTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { ChevronDown, Check, CircleDollarSign } from "lucide-react";
import { addDays } from "date-fns";
import { AddTime } from "./addTime";
import {
  setTimesheet,
  setFetchAgain,
  setTimesheetData,
  updateTimesheetData,
  setEmployeeWeekDate,
  resetTimesheetDataState,
  setEmployee,
  setDialog,
  setEditDialog,
} from "@/store/team";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Employee } from "@/types";
import { LeaveProps, NewTimesheetProps, TaskDataItemProps, timesheet } from "@/types/timesheet";
import { useNavigate } from "react-router-dom";
import { Input } from "@/app/components/ui/input";
import { timeFormatRegex } from "@/schema/timesheet";
import { EditTime } from "@/app/pages/timesheet/editTime";

const EmployeeDetail = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.timesheet.get_timesheet_data", {
    employee: id,
    start_date: teamState.employeeWeekDate,
    max_week: 4,
  });

  const handleAddTime = () => {
    const timesheet = {
      name: "",
      task: "",
      date: getFormatedDate(new Date()),
      description: "",
      hours: 0,
      isUpdate: false,
    };
    dispatch(setTimesheet({ timesheet, id }));
  };
  const handleLoadData = () => {
    if (teamState.timesheetData.data == undefined || Object.keys(teamState.timesheetData.data).length == 0) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const obj = teamState.timesheetData.data[Object.keys(teamState.timesheetData.data).pop()];
    const date = getFormatedDate(addDays(obj.start_date, -1));
    dispatch(setEmployeeWeekDate(date));
  };
  useEffect(() => {
    dispatch(resetTimesheetDataState());
    const date = getTodayDate();
    dispatch(setEmployeeWeekDate(date));
    dispatch(setEmployee(id as string));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (teamState.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (teamState.timesheetData.data && Object.keys(teamState.timesheetData.data).length > 0) {
        dispatch(updateTimesheetData(data.message));
      } else {
        dispatch(setTimesheetData(data.message));
      }
    }
    if (error) {
      console.log(error);
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, teamState.employeeWeekDate, error, teamState.isFetchAgain]);
  return (
    <>
      {teamState.isDialogOpen && <AddTime />}
      {teamState.isEditDialogOpen && (
        <EditTime
          open={teamState.isEditDialogOpen}
          employee={teamState.employee}
          date={teamState.timesheet.date}
          task={teamState.timesheet.task}
          onClose={() => {
            dispatch(setEditDialog(false));
            dispatch(setFetchAgain(true));
          }}
        />
      )}
      <EmployeeCombo />
      <Tabs defaultValue="timesheet" className="mt-3">
        <div className="flex gap-x-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
          </TabsList>
          <Button className="float-right mb-1" onClick={handleAddTime}>
            Add Time
          </Button>
        </div>
        {isLoading ? (
          <Spinner isFull />
        ) : (
          <>
            <div className="overflow-y-scroll" style={{ height: "calc(100vh - 11rem)" }}>
              <TabsContent value="timesheet" className="mt-0">
                <Timesheet />
              </TabsContent>
              <TabsContent value="time" className="mt-0">
                <Time
                  callback={() => {
                    dispatch(setFetchAgain(true));
                  }}
                />
              </TabsContent>
            </div>
            <div className="mt-5">
              <Button className="float-left" variant="outline" onClick={handleLoadData}>
                Load More
              </Button>
            </div>
          </>
        )}
      </Tabs>
    </>
  );
};

const Timesheet = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();

  const onCellClick = (timesheet: NewTimesheetProps) => {
    dispatch(setTimesheet({ timesheet, id }));
    if (timesheet.hours > 0) {
      dispatch(setEditDialog(true));
    } else {
      dispatch(setDialog(true));
    }
  };

  return (
    <div className="flex flex-col">
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet]) => {
          return (
            <>
              <Accordion type="multiple" key={key} defaultValue={[key]}>
                <AccordionItem value={key}>
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex justify-between w-full">
                      <Typography variant="h6" className="font-normal">
                        {key}: {floatToTime(value.total_hours)}h
                      </Typography>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <TimesheetTable
                      dates={value.dates}
                      holidays={teamState.timesheetData.holidays}
                      leaves={teamState.timesheetData.leaves}
                      tasks={value.tasks}
                      onCellClick={onCellClick}
                      working_frequency={teamState.timesheetData.working_frequency}
                      working_hour={teamState.timesheetData.working_hour}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          );
        })}
    </div>
  );
};

export const Time = ({ callback, isOpen = false }: { isOpen?: boolean; callback?: () => void }) => {
  const teamState = useSelector((state: RootState) => state.team);
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const { toast } = useToast();
  const updateTime = (value: NewTimesheetProps) => {
    call(value)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        callback && callback();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  return (
    <div>
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet]) => {
          return (
            <>
              <Accordion type="multiple" key={key} defaultValue={isOpen ? [key] : []}>
                <AccordionItem value={key}>
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex justify-between w-full">
                      <Typography variant="h6" className="font-normal">
                        {key}: {floatToTime(value.total_hours)}h
                      </Typography>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {value.dates.map((date: string, index: number) => {
                      const { date: formattedDate, day } = prettyDate(date, true);
                      const matchingTasks = Object.entries(value.tasks).flatMap(
                        ([taskName, task]: [string, TaskDataItemProps]) =>
                          task.data
                            .filter(
                              (taskItem: TaskDataItemProps[]) => getDateFromDateAndTime(taskItem.from_time) === date
                            )
                            .map((taskItem: TaskDataItemProps) => ({
                              ...taskItem,
                              taskName,
                              projectName: task.project_name,
                            }))
                      );
                      const isHoliday = teamState.timesheetData.holidays.includes(date);
                      let totalHours = matchingTasks.reduce((sum, task) => sum + task.hours, 0);
                      const leave = teamState.timesheetData.leaves.find((data: LeaveProps) => {
                        return date >= data.from_date && date <= data.to_date;
                      });
                      const isHalfDayLeave = leave?.half_day && leave?.half_day_date == date ? true : false;
                      if (leave && !isHoliday) {
                        if (isHalfDayLeave) {
                          totalHours += 4;
                        } else {
                          totalHours += 8;
                        }
                      }
                      const isExtended = calculateExtendedWorkingHour(
                        totalHours,
                        teamState.timesheetData.working_hour,
                        teamState.timesheetData.working_frequency
                      );
                      return (
                        <div key={index} className="flex flex-col">
                          <div className="bg-gray-100 p-1 rounded border-b flex items-center gap-x-2">
                            <Typography
                              variant="p"
                              className={cn(
                                isExtended == 0 && "text-destructive",
                                isExtended && "text-success",
                                isExtended == 2 && "text-warning"
                              )}
                            >
                              {floatToTime(totalHours)}h
                            </Typography>
                            <Typography variant="p">{formattedDate}</Typography>
                            {isHoliday && (
                              <Typography variant="p" className="text-gray-600">
                                (Holiday)
                              </Typography>
                            )}
                            {leave && !isHoliday && (
                              <Typography variant="p" className="text-gray-600">
                                ({isHalfDayLeave ? "Half day leave" : "Full Day Leave"})
                              </Typography>
                            )}
                          </div>
                          {matchingTasks?.map((task: TaskDataItemProps, index: number) => {
                            const data = {
                              name: task.name,
                              parent: task.parent,
                              task: task.task,
                              employee: teamState.employee,
                              date: getDateFromDateAndTime(task.from_time),
                              description: task.description,
                              hours: task.hours,
                              is_billable: task.is_billable,
                            };
                            return (
                              <div className="flex gap-x-4 p-2 border-b last:border-b-0" key={index}>
                                <TimeInput
                                  disabled={task.docstatus == 1}
                                  data={data}
                                  callback={updateTime}
                                  employee={teamState.employee}
                                  className="w-12 p-1 h-8"
                                />
                                <div className="grid w-full grid-cols-3">
                                  <Typography variant="p" className="font-bold flex">
                                    {task.taskName}
                                    {task.is_billable == true && (
                                      <CircleDollarSign className="w-4 h-4 ml-1 stroke-success" />
                                    )}
                                  </Typography>

                                  <p
                                    dangerouslySetInnerHTML={{ __html: preProcessLink(task.description ?? "") }}
                                    className="text-sm font-normal col-span-2"
                                  ></p>
                                </div>
                              </div>
                            );
                          })}
                          {matchingTasks.length == 0 && (
                            <Typography variant="p" className="text-center p-3">
                              No data.
                            </Typography>
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          );
        })}
    </div>
  );
};
const EmployeeCombo = () => {
  const { id } = useParams();
  const [selectedValues, setSelectedValues] = useState<string>(id ?? "");
  const [employee, setEmployee] = useState<Employee | undefined>();
  const navigate = useNavigate();

  const { data: employees } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Employee",
      fields: ["name", "employee_name", "image"],
      filters: [["status", "=", "Active"]],
      limit_page_length: "null",
    },
    { shouldRetryOnError: false }
  );
  const onEmployeeChange = (name: string) => {
    setSelectedValues(name);
    navigate(`/team/employee/${name}`);
  };

  useEffect(() => {
    const res = employees?.message.find((item: Employee) => item.name === selectedValues);
    setEmployee(res);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, id]);
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("items-center gap-x-4 px-2 justify-between [&[data-state=open]>svg]:rotate-180")}
        >
          <span className="flex gap-x-2 items-center">
            <Avatar className="w-8 h-8">
              <AvatarImage src={employee?.image} alt="image" />
              <AvatarFallback>{employee?.employee_name[0]}</AvatarFallback>
            </Avatar>
            {employee?.employee_name}
          </span>
          <ChevronDown size={24} className="w-4 h-4 transition-transform duration-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search Employee" />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {employees?.message.map((item: Employee, index: number) => {
                const isActive = selectedValues == item.name;
                return (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      onEmployeeChange(item.name);
                    }}
                    className="flex gap-x-2 text-primary font-normal"
                    value={item.employee_name}
                  >
                    <Check className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
                    <Avatar>
                      <AvatarImage src={item.image} alt={item.employee_name} />
                      <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                    </Avatar>
                    <Typography variant="p">{item.employee_name}</Typography>
                  </CommandItem>
                );
              })}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const TimeInput = ({
  data,
  employee,
  disabled = false,
  className,
  callback,
}: {
  data: NewTimesheetProps;
  employee: string;
  className?: string;
  disabled?: boolean;
  callback: (data: NewTimesheetProps) => void;
}) => {
  const [hour, setHour] = useState(floatToTime(data.hours));
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let time = 0;
    const hour = e.target.value;
    setHour(hour);

    if (timeFormatRegex.test(hour)) {
      const [hours, minutes] = hour.split(":").map(Number);
      time = hours + minutes / 60;
    } else {
      time = parseFloat(hour);
    }
    if (time == 0 || Number.isNaN(time)) return;
    timeUpdate(time);
  };
  const timeUpdate = deBounce((hour: number) => {
    const value = {
      ...data,
      hours: hour,
      employee: employee,
    };
    callback(value);
  }, 1500);
  return <Input value={hour} className={cn("w-20", className)} onChange={handleHourChange} disabled={disabled} />;
};
export default EmployeeDetail;
