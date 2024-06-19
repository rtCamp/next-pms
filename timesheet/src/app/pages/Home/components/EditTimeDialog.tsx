import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { reducer, initialState } from "@/app/reducer/home/edittime";
import { useEffect, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/state/store";
import {
  setIsEditTimeDialogOpen,
  setIsFetchAgain,
} from "@/app/state/employeeList";
import { Separator } from "@/components/ui/separator";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { cn, getFormatedDate, parseFrappeErrorMsg } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Typography } from "@/app/components/Typography";
import { EmployeeProps } from "@/app/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as CalIcon, Trash } from "@/app/components/Icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
  Command,
} from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { debounce, get } from "lodash";
import { useToast } from "@/components/ui/use-toast";

interface timesheetProps {
  project_name: string;
  department: string;
  name: string;
  project: string;
  hours: number;
  task_subject: string;
  task_name: string;
  parent: string;
  description: string;
}
export function EditTimeDialog({
  state,
  closeAction,
}: {
  state: any;
  closeAction: () => void;
}) {
  const { call: saveTime } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.save"
  );
  const { call: deleteTime } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.delete"
  );
  const { call: getTimesheet } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.get_timesheet_detail_for_employee"
  );
  const [localState, localDispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();

  function fetch(employee: string, date: string) {
    if (!employee || !date) return;
    getTimesheet({
      employee: employee,
      date: date,
    })
      .then((res) => {
        localDispatch({ type: "setData", payload: res.message });
      })
      .catch((err) => {
        const errorMsg = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: errorMsg,
        });
      });
  }
  useEffect(() => {
    const date = getFormatedDate(state.dialogInput.date);
    localDispatch({ type: "setSelectedDate", payload: date });
    localDispatch({ type: "setDialogInput", payload: state.dialogInput });
    localDispatch({ type: "setIsOpen", payload: state.isEditTimeDialogOpen });
  }, []);
  useEffect(() => {
    fetch(localState.dialogInput.employee, localState.selectedDate);
  }, [localState.isOpen]);
  const { data: employees, isLoading: isEmployeeLoading } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Employee",
      fields: ["name", "employee_name", "image"],
      filters: {
        status: "Active",
      },
    },
    "employees"
  );

  useEffect(() => {
    fetch(localState.dialogInput.employee, localState.dialogInput.date);
  }, [localState.dialogInput.employee, localState.dialogInput.date]);

  const onEmployeeSelect = (employee: string) => {
    localDispatch({
      type: "setDialogInput",
      payload: { ...localState.dialogInput, employee: employee },
    });
    localDispatch({ type: "setIsEmployeeBoxOpen", payload: false });
  };
  const onDateSelect = (
    day: Date | undefined,
    selectedDay: Date,
    activeModifiers: any,
    e: React.MouseEvent<Element, globalThis.MouseEvent>
  ) => {
    if (!day) return;
    const formatedDate = getFormatedDate(day);
    localDispatch({ type: "setSelectedDate", payload: formatedDate });
    localDispatch({ type: "setIsDatePickerOpen", payload: false });
  };
  const onDeleteTime = (parent: string, name: string) => {
    deleteTime({ parent: parent, name: name })
      .then((res) => {
        toast({
          variant: "success",
          title: res.message,
        });
        fetch(localState.dialogInput.employee, localState.dialogInput.date);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: error,
        });
      });
  };
  const onTaskTimeChange = debounce(
    (
      parent: string,
      name: string,
      hour: string,
      description: string,
      task: string
    ) => {
      if (!hour) return;
      const data = {
        date: localState.dialogInput.date,
        employee: localState.dialogInput.employee,
        description: description,
        hours: hour,
        parent: parent,
        name: name,
        task: task,
        is_update: true,
      };
      saveTime(data)
        .then((res) => {
          toast({
            variant: "success",
            title: res.message,
          });
        })
        .catch((err) => {
          const error = parseFrappeErrorMsg(err);
          toast({
            variant: "destructive",
            title: error,
          });
        });
    },
    1000
  );
  const closeDialog = () => {
    localDispatch({ type: "setIsOpen", payload: false });
    closeAction();
  };

  return (
    <Sheet open={localState.isOpen} onOpenChange={closeDialog}>
      <SheetContent className="sm:max-w-[676px] px-11 py-6">
        {isEmployeeLoading || !localState.data ? (
          <></>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-bold">Edit Time</SheetTitle>
            </SheetHeader>
            <Separator className="my-6" />
            <div className="flex gap-x-2 flex-wrap sm:flex-nowrap ">
              <div className="w-full sm:w-6/12">
                <Popover
                  open={localState.isEmployeeBoxOpen}
                  onOpenChange={() =>
                    localDispatch({
                      type: "setIsEmployeeBoxOpen",
                      payload: !localState.isEmployeeBoxOpen,
                    })
                  }
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full px-2 py-4 justify-between  !mt-0 truncate "
                    >
                      <div className="flex items-center gap-x-2">
                        {state.dialogInput.employee ? (
                          <>
                            <Avatar className="h-[24px] w-[24px]">
                              <AvatarFallback>
                                {
                                  employees.message.find(
                                    (employee: EmployeeProps) =>
                                      employee.name ===
                                      localState.dialogInput.employee
                                  )?.employee_name[0]
                                }
                              </AvatarFallback>
                              <AvatarImage
                                src={decodeURIComponent(
                                  employees.message.find(
                                    (employee: EmployeeProps) =>
                                      employee.name ===
                                      localState.dialogInput.employee
                                  )?.image
                                )}
                                alt="Employee Image"
                              />
                            </Avatar>
                            <Typography variant="p" className="sm:text-sm">
                              {
                                employees.message.find(
                                  (employee: EmployeeProps) =>
                                    employee.name ===
                                    localState.dialogInput.employee
                                )?.employee_name
                              }
                            </Typography>
                          </>
                        ) : (
                          <div className="flex justify-center items-center">
                            <p className="ml-2 shrink-0 opacity-50">
                              Search Employee...
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96">
                    <Command>
                      <CommandInput placeholder="Search Employee..." />
                      <ScrollArea>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {employees.message.map(
                              (employee: EmployeeProps) => (
                                <CommandItem
                                  className="hover:cursor-pointer truncate aria-selected:bg-primary aria-selected:text-primary-forground"
                                  key={employee.name}
                                  value={employee.name}
                                  onSelect={onEmployeeSelect}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      localState.dialogInput.employee ===
                                        employee.name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex gap-x-3">
                                    <Avatar className="h-[24px] w-[24px]">
                                      <AvatarFallback>
                                        {employee.employee_name[0]}
                                      </AvatarFallback>
                                      <AvatarImage
                                        src={decodeURIComponent(employee.image)}
                                        alt="Employee Image"
                                      />
                                    </Avatar>
                                    <Typography
                                      variant="p"
                                      className="sm:text-sm"
                                    >
                                      {employee.employee_name}
                                    </Typography>
                                  </div>
                                </CommandItem>
                              )
                            )}
                          </CommandList>
                        </CommandGroup>
                      </ScrollArea>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-x-2 w-6/12">
                <Popover
                  open={localState.isDatePickerOpen}
                  onOpenChange={() =>
                    localDispatch({
                      type: "setIsDatePickerOpen",
                      payload: !localState.isDatePickerOpen,
                    })
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full  justify-between text-left font-normal !mt-0  text-muted-foreground"
                      )}
                    >
                      {localState.dialogInput.date ? (
                        localState.dialogInput.date
                      ) : (
                        <span>{localState.selectedDate}</span>
                      )}
                      <CalIcon stroke="#AB3A6C" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      disableNavigation
                      selected={new Date(localState.selectedDate)}
                      onSelect={onDateSelect}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="accent">Add Time</Button>
              </div>
            </div>
            <Table className="my-6">
              <TableHeader className="[&_th]:p-2">
                <TableRow className="bg-primary">
                  <TableHead>Time</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>
                    <Trash />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-primary [&_td]:p-2">
                {localState?.data?.map((item: timesheetProps) => {
                  return (
                    <TableRow>
                      <TableCell>
                        <div className="bg-background flex items-center rounded-md justify-around">
                          <TimeInput data={item} callback={onTaskTimeChange} />
                          <ChevronDown size={16} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="p"
                          className="truncate max-w-72 sm:text-sm"
                        >
                          {item.task_subject}
                        </Typography>
                        <Typography
                          variant="p"
                          className="text-muted-foreground truncate !text-[13px]"
                        >
                          {item.project_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="p" className="truncate sm:text-sm">
                          {item.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Trash
                          className="hover:cursor-pointer"
                          onClick={() => onDeleteTime(item.parent, item.name)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimeInput({
  data,
  callback,
}: {
  data: timesheetProps;
  callback: any;
}) {
  const [hour, setHour] = useState(data.hours);
  const onHourChange = (e: any) => {
    setHour(e.target.value);
    callback &&
      callback(
        data.parent,
        data.name,
        e.target.value,
        data.description,
        data.task_name
      );
  };
  return (
    <Input
      className="border-none max-w-14 px-1  focus-visible:ring-0 focus-visible:ring-offset-0"
      value={hour}
      onChange={onHourChange}
    />
  );
}
