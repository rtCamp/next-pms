import { Button } from "@/app/components/ui/button";
import { useParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { useFrappeGetCall } from "frappe-react-sdk";
import { cn, getFormatedDate, getTodayDate, parseFrappeErrorMsg } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/ui/use-toast";
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import { TimesheetTable } from "@/app/components/timesheetTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { addDays } from "date-fns";
import { AddTime } from "./addTime";
import {
  setTimesheet,
  setDialog,
  setEmployee,
  setFetchAgain,
  setTimesheetData,
  updateTimesheetData,
  setWeekDate,
  resetState,
} from "@/store/team";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

const EmployeeDetail = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "timesheet_enhancer.api.timesheet.get_timesheet_data",
    {
      employee: id,
      start_date: teamState.weekDate,
      max_week: 4,
    },
    {
      errorRetryCount: 1,
    }
  );
  const { data: employees, isLoading: isEmployeeLoading } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Employee",
    fields: ["name", "employee_name", "image"],
  });

  const onEmployeeChange = () => {
    // navigate(`/team/employee/${name}`);
  };
  const handleLoadData = () => {
    if (teamState.timesheetData.data == undefined || Object.keys(teamState.timesheetData.data).length == 0) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const obj = teamState.timesheetData.data[Object.keys(teamState.timesheetData.data).pop()];
    const date = getFormatedDate(addDays(obj.start_date, -1));
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
  };
  const handleAddTime = () => {
    const timesheetData = {
      name: "",
      parent: "",
      task: "",
      date: getFormatedDate(new Date()),
      description: "",
      hours: 0,
      isUpdate: false,
    };
    dispatch(setTimesheet(timesheetData));
    dispatch(setEmployee(id as string));
    dispatch(setDialog(true));
  };
  useEffect(() => {
    dispatch(resetState());
    const date = getTodayDate();
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (teamState.isFetchAgain) {
      mutate();
      setFetchAgain(false);
    }
    if (data) {
      if (teamState.timesheetData.data && Object.keys(teamState.timesheetData.data).length > 0) {
        dispatch(updateTimesheetData(data.message.data));
      } else {
        dispatch(setTimesheetData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
      setFetchAgain(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, teamState.weekDate, error, teamState.isFetchAgain]);

  if (isLoading || isEmployeeLoading) {
    return <Spinner isFull />;
  }

  return (
    <div className="flex flex-col">
      {teamState.isDialogOpen && <AddTime />}
      <div>
        <EmployeeCombo id={id} data={employees?.message} handleChange={onEmployeeChange} />
        <Button className="float-right mb-1" onClick={handleAddTime}>
          Add Time
        </Button>
      </div>
      {isLoading ? (
        <Spinner isFull />
      ) : (
        <>
          <div className="overflow-y-scroll" style={{ height: "calc(100vh - 8rem)" }}>
            {teamState.timesheetData.data &&
              Object.keys(teamState.timesheetData.data).length > 0 &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Object.entries(teamState.timesheetData.data).map(([key, value]: [string, any]) => {
                return (
                  <>
                    <Accordion type="multiple" key={key} defaultValue={[key]}>
                      <AccordionItem value={key}>
                        <AccordionTrigger className="hover:no-underline w-full">
                          <div className="flex justify-between w-full">
                            <Typography variant="h5" className="font-medium">
                              {key} : {value.total_hours}h
                            </Typography>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <TimesheetTable
                            dates={value.dates}
                            holidays={value.holidays}
                            leaves={value.leaves}
                            tasks={value.tasks}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                );
              })}
          </div>
          <div className="mt-5">
            <Button className="float-left" variant="outline" onClick={handleLoadData}>
              Load More
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeDetail;

type Employee = {
  name: string;
  image: string;
  employee_name: string;
};
const EmployeeCombo = ({
  id,
  data,
  handleChange,
}: {
  id: string | undefined;
  data: Array<Employee>;
  handleChange: (name: string) => void;
}) => {
  const [selectedValues, setSelectedValues] = useState<string>(id ?? "");
  const [employee, setEmployee] = useState<Employee | undefined>();

  const onEmployeeChange = (name: string) => {
    setSelectedValues(name);
    handleChange(name);
  };
  useEffect(() => {
    const res = data?.find((item) => item.name === selectedValues);
    setEmployee(res);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues]);
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled
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
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search Employee" />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {data.map((item, index) => {
                const isActive = selectedValues == item.name;
                return (
                  <CommandItem
                    key={index}
                    onSelect={onEmployeeChange}
                    className="flex gap-x-2 text-primary font-normal"
                    value={item.name}
                  >
                    <Checkbox checked={isActive} />
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
