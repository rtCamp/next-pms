import { RootState } from "@/app/state/store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScreenLoader } from "@/app/components/Loader";
import { useDispatch, useSelector } from "react-redux";
import {
  setTeam,
  setFetching,
  setDialogInput,
  setIsAddTimeDialogOpen,
  setIsFetchAgain,
  setTimesheet,
  setIsDialogOpen,
  setWeekDate,
  setStart,
  updateTeam,
  setHasMore,
} from "@/app/state/team";
import { TaskCellClickProps } from "@/app/types/timesheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addDays,
  cn,
  floatToTime,
  formatDate,
  getTodayDate,
  parseFrappeErrorMsg,
} from "@/app/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/app/components/Typography";
import { TimesheetTable } from "@/app/pages/Timesheet/components/Table";
import { TaskCell } from "@/app/components/TaskCell";
import { AddTimeDialog } from "../Home/components/AddTimeDialog";
import { AddTimeDialog as Edit } from "../Timesheet/components/AddTimeDialog";
import { useToast } from "@/components/ui/use-toast";

export default function Team() {
  const state = useSelector((state: RootState) => state.team);
  const observerTarget = useRef(null);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { data, isLoading, mutate, error } = useFrappeGetCall(
    "timesheet_enhancer.api.team.get_weekly_team_view_data",
    {
      date: state.weekDate,
      start: state.start,
    }
  );
  useEffect(() => {
    dispatch(setFetching(true));
    if (data && !isLoading) {
      if (state.start > 0) {
        const d = {
          empData: { ...state.data.empData, ...data.message.empData },
          employees: [...state.data.employees, ...data.message.employees],
          holiday_map: [...state.data.holiday_map, ...data.message.holiday_map],
          has_more: data.message.has_more,
        };
        dispatch(updateTeam(d));
      } else {
        dispatch(setTeam(data?.message));
      }
      dispatch(setHasMore(data.message?.has_more));
      dispatch(setFetching(false));
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        title: err,
      });
      dispatch(setFetching(false));
    }
  }, [data, isLoading, error]);

  useEffect(() => {
    if (state.isFetchAgain) {
      mutate();
      dispatch(setIsFetchAgain(false));
    }
  }, [state.isFetchAgain]);

  useEffect(() => {
    if (!state.hasMore) return;
    mutate();
  }, [state.weekDate, state.start]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          dispatch(setStart(state.start + 10));
        }
        console.log(entries);
      },
      { threshold: 1, rootMargin: "0px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
    console.log(observerTarget.current);
  }, [observerTarget]);
  const onTaskCellClick = ({
    date,
    name,
    parent,
    task,
    description,
    hours,
    employee,
  }: TaskCellClickProps) => {
    if (!employee) {
      toast({
        variant: "destructive",
        title: "Employee not found",
      });
      return;
    }
    if (hours == 0) {
      const data = {
        employee,
        task: "",
        hours: "",
        description: "",
        date: getTodayDate(),
        is_update: false,
      };
      dispatch(setDialogInput(data));
      dispatch(setIsAddTimeDialogOpen(true));
    } else {
      dispatch(
        setTimesheet({
          date,
          name,
          parent,
          task,
          description,
          isUpdate: true,
          hours: hours.toString(),
          employee,
        })
      );
      dispatch(setIsDialogOpen(true));
    }
  };
  const onClose = () => {
    const data = {
      employee: "",
      task: "",
      hours: "",
      description: "",
      date: "",
      is_update: false,
    };
    dispatch(setDialogInput(data));
    setTimeout(() => {
      dispatch(setIsAddTimeDialogOpen(false));
      dispatch(setIsDialogOpen(false));
    }, 500);
    dispatch(setIsFetchAgain(true));
  };
  const handleprevWeek = () => {
    const date = addDays(state.weekDate, -7);
    dispatch(setWeekDate(date));
    dispatch(setStart(0));
  };
  const handlenextWeek = () => {
    const date = addDays(state.weekDate, 7);
    dispatch(setWeekDate(date));
    dispatch(setStart(0));
  };
  const onAddTimeClick = (employee: string) => {
    const data = {
      employee,
      task: "",
      hours: "",
      description: "",
      date: getTodayDate(),
      is_update: false,
    };
    dispatch(setDialogInput(data));
    dispatch(setIsAddTimeDialogOpen(true));
  };
  const onsubmit = () => {
    dispatch(setIsFetchAgain(true));
  };
  if (state.isFetching && state.start == 0) {
    return <ScreenLoader isFullPage={true} />;
  }
  console.log(observerTarget.current);
  return (
    <>
      {!error ? (
        <>
          <Tabs defaultValue="team">
            <div className=" bg-muted rounded-sm flex items-center">
              <TabsList className="justify-start w-full  py-0 ">
                <TabsTrigger value="team">Timesheet</TabsTrigger>
              </TabsList>
              <div className="flex gap-x-2 pr-1">
                <Button
                  className=" p-2 h-[28px]"
                  variant="outline"
                  onClick={handleprevWeek}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  className=" p-2  h-[28px]"
                  variant="outline"
                  onClick={handlenextWeek}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <TabsContent
              value="team"
              style={{ height: "calc(100vh - 8rem)" }}
              className="overflow-y-auto no-scrollbar"
            >
              <Table>
                <TableHeader>
                  <TableRow className="flex h-16 ">
                    <TableHead
                      key="Heading"
                      className="flex w-96 font-medium items-center h-16 text-heading !px-2 font-bold text-base"
                    >
                      Members
                    </TableHead>
                    {state.data.dates.map((date: string) => {
                      const { date: formattedDate, day } = formatDate(date);
                      const isHoliday = state.data.holiday_map.includes(date);

                      return (
                        <div className="flex w-20  h-16    flex-col max-w-20  px-0 ">
                          <TableHead
                            key={date}
                            className="h-full flex flex-col justify-center px-0"
                          >
                            <div className={cn(`font-semibold `)}>{day}</div>
                            <div className={cn(`text-xs font-medium `)}>
                              {formattedDate.toUpperCase()}
                            </div>
                          </TableHead>
                        </div>
                      );
                    })}
                    <TableHead
                      key="Total"
                      className="flex w-24  justify-center flex-col h-16  text-heading text-center max-w-24 font-bold  px-0"
                    >
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data.employees.map((employee: any, index) => {
                    const hours = state.data.empData[employee.name].hours;
                    const leaves = state.data.empData[employee.name].leaves;
                    let total = 0;
                    const isLast = index === state.data.employees.length - 1;

                    return (
                      <div ref={isLast ? observerTarget : null}>
                        <Accordion type="multiple">
                          <AccordionItem
                            key={employee.name}
                            value={employee.name}
                          >
                            <AccordionTrigger className="justify-start rounded-none hover:no-underline w-full p-2 py-0">
                              <TableRow className="flex">
                                <TableCell className="flex items-center gap-x-2 px-2 w-[360px] ">
                                  <Avatar className="h-[35px] w-[35px] ">
                                    <AvatarImage
                                      src={employee.image}
                                      alt="employee"
                                    />
                                    <AvatarFallback>
                                      {employee.employee_name[0]}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex items-start flex-col">
                                    <Typography
                                      variant="p"
                                      className="!font-bold !text-sm"
                                    >
                                      {employee.employee_name}
                                    </Typography>
                                    <Typography variant="muted">
                                      {employee.designation}
                                    </Typography>
                                  </div>
                                </TableCell>

                                {hours.map((hour: any, index: number) => {
                                  const date = hour.date;
                                  const leaveData = leaves.find((data: any) => {
                                    return (
                                      date >= data.from_date &&
                                      date <= data.to_date
                                    );
                                  });
                                  let dayTotal = hour.hours;
                                  if (leaveData) {
                                    if (
                                      leaveData.half_day ||
                                      (leaveData.half_day_date &&
                                        leaveData.half_day_date == date)
                                    ) {
                                      dayTotal += 4;
                                    } else {
                                      dayTotal += 8;
                                    }
                                  }
                                  total += dayTotal;
                                  return (
                                    <TaskCell
                                      classname="text-foreground items-start  hover:cursor-not-allowed p-0 text-[15px]"
                                      onCellClick={() => {}}
                                      name={""}
                                      parent={""}
                                      task={""}
                                      description={`Total working hours for the day is ${floatToTime(
                                        dayTotal
                                      )}`}
                                      hours={dayTotal}
                                      date={hour.date}
                                      isCellDisabled={true}
                                    />
                                  );
                                })}
                                <TableCell
                                  key={"Total"}
                                  className="flex w-24 justify-center flex-col font-bold max-w-24 px-0 text-center text-[15px] "
                                >
                                  {floatToTime(total)}
                                </TableCell>
                              </TableRow>
                            </AccordionTrigger>
                            <AccordionContent>
                              <TimesheetTable
                                data={state.data.empData[employee.name]}
                                onTaskCellClick={onTaskCellClick}
                                isHeading={false}
                                employee={employee.name}
                              />

                              <div className="pt-4">
                                <Button
                                  onClick={() => onAddTimeClick(employee.name)}
                                >
                                  Add Time
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    );
                  })}
                </TableBody>
              </Table>
              {/* <div ref={observerTarget}></div> */}
            </TabsContent>
          </Tabs>
          {state.isAddTimeDialogOpen && (
            <AddTimeDialog
              state={state}
              closeAction={onClose}
              submitAction={onsubmit}
            />
          )}
          {state.isDialogOpen && (
            <Edit state={state} closeAction={onClose} submitAction={onsubmit} />
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}
