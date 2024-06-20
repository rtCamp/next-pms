import {
  getTodayDate,
  formatDate,
  addDays,
  parseFrappeErrorMsg,
} from "@/app/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MultiCombo } from "@/app/components/MultiCombo";
import { Typography } from "@/app/components/Typography";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScreenLoader } from "@/app/components/Loader";
import {
  FrappeContext,
  FrappeConfig,
  useFrappeGetCall,
} from "frappe-react-sdk";
import { useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/state/store";
import { setProject } from "@/app/state/project";
import { setDepartment } from "@/app/state/department";
import {
  setEmployeeWeekList,
  setDepartment as setDepartmentState,
  setEmployeeName,
  setFetching,
  setHeading,
  setProject as setProjectState,
  setWeekDate,
  setDialogInput,
  setIsAddTimeDialogOpen,
  setIsFetchAgain,
  setIsEditTimeDialogOpen,
} from "@/app/state/employeeList";
import { Button } from "@/components/ui/button";
import { Cell } from "./components/Cell";
import { debounce } from "lodash";
import { AddTimeDialog } from "./components/AddTimeDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { EditTimeDialog } from "./components/EditTimeDialog";
import { useToast } from "@/components/ui/use-toast";
export default function CompactView() {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const projects = useSelector((state: RootState) => state.projects);
  const departments = useSelector((state: RootState) => state.departments);
  const state = useSelector((state: RootState) => state.employeeList);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const {
    data: weekData,
    isLoading,
    mutate,
    error,
  } = useFrappeGetCall(
    "timesheet_enhancer.api.team.get_weekly_compact_view_data",
    {
      date: state.weekDate,
      employee_name: state.employeeName,
      department: state.selectedDepartment,
      project: state.selectedProject,
    },
    "weekData",
    {
      dedupingInterval: 1000 * 60 * 10,
    }
  );

  useEffect(() => {
    dispatch(setFetching(true));

    if (projects.value.length === 0) {
      call
        .get("frappe.client.get_list", {
          doctype: "Project",
          fields: ["name", "project_name"],
        })
        .then((res) => {
          dispatch(setProject(res.message));
        });
    }
    if (departments.value.length === 0) {
      call
        .get("frappe.client.get_list", {
          doctype: "Department",
          fields: ["name", "department_name"],
          filters: { is_group: false },
        })
        .then((res) => {
          dispatch(setDepartment(res.message));
        });
    }
    dispatch(setFetching(false));
  }, []);

  useEffect(() => {
    dispatch(setFetching(true));
    if (weekData && !isLoading) {
      dispatch(setEmployeeWeekList(weekData?.message));
      dispatch(setFetching(false));
    }
    if (error && !weekData) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        title: err,
      });
      dispatch(setFetching(false));
    }
  }, [weekData, isLoading, error]);

  useEffect(() => {
    if (state.weekDate == getTodayDate() && !state) return;
    mutate();
  }, [
    state.weekDate,
    state.employeeName,
    state.selectedDepartment,
    state.selectedProject,
    state.isFetchAgain,
  ]);

  useEffect(() => {
    if (!state.dates) return;
    const dates = state.dates;
    dispatch(
      setHeading({ curentHeading: dates[1]?.key, prevHeading: dates[0]?.key })
    );
  }, [state.dates]);

  const handleprevWeek = () => {
    const date = addDays(state.weekDate, -14);
    dispatch(setWeekDate(date));
  };
  const handlenextWeek = () => {
    const date = addDays(state.weekDate, 14);
    dispatch(setWeekDate(date));
  };
  const setSelectedDepartment = (data: any) => {
    dispatch(setDepartmentState(data));
  };
  const setSelectedProject = (data: any) => {
    dispatch(setProjectState(data));
  };
  const onEmployeeNameInputChange = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
    },
    1000
  );
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
      dispatch(setIsEditTimeDialogOpen(false));
    }, 500);
    dispatch(setIsFetchAgain(true));
  };
  const onSubmit = () => {
    dispatch(setIsFetchAgain(true));
  };
  if (state.isFetching) {
    return <ScreenLoader isFullPage={true} />;
  }
  const dates = state?.dates;
  const res = state?.data;

  return (
    <>
      {!error ? (
        <div>
          <div id="header" className="grid grid-cols-11 w-full">
            <div className="flex gap-2 pr-2 col-span-3 flex-wrap">
              <MultiCombo
                comboData={departments.value.map((item) => ({
                  value: item.name,
                  label: item.department_name,
                }))}
                buttonLabel="Departments"
                buttonClass="w-fit"
                parentCallback={setSelectedDepartment}
              />
              <MultiCombo
                comboData={projects.value.map((item) => ({
                  value: item.name,
                  label: item.project_name,
                }))}
                buttonLabel="Projects"
                buttonClass="w-fit"
                parentCallback={setSelectedProject}
              />
            </div>
            <div className="flex items-center col-span-4 text-center w-full border-r-2">
              <Button
                variant="outline"
                onClick={handleprevWeek}
                className="p-1 h-auto"
              >
                <ChevronLeft size={16} className="hover:cursor-pointer" />
              </Button>
              <Typography variant="p" className="!font-semibold w-full">
                {state.prevHeading}
              </Typography>
            </div>
            <div className="flex flex-row-reverse items-center col-span-4  text-center w-full">
              <Button
                variant="outline"
                onClick={handlenextWeek}
                className="p-1 h-auto"
              >
                <ChevronRight size={16} className="hover:cursor-pointer" />
              </Button>
              <Typography variant="p" className="!font-semibold w-full">
                {state.curentHeading}
              </Typography>
            </div>
          </div>
          <ScrollArea className="mt-4" style={{ height: "calc(100vh - 9rem)" }}>
            <Table>
              <TableHeader>
                <TableRow className="grid grid-cols-11 w-full border-t">
                  <TableHead className=" flex items-center col-span-3 px-3">
                    <Input
                      placeholder="Employee name..."
                      className=""
                      onInput={onEmployeeNameInputChange}
                    />
                  </TableHead>
                  {dates?.map((item: any) => {
                    const dateMap = item?.dates;
                    return (
                      <TableHead key={item.key} className="px-0 col-span-4">
                        <TableRow
                          className={`flex h-full !border-b-0 w-full [&_td:last-child]:border-r-2 ${
                            item.key != "This Week" ? "bg-primary" : ""
                          }`}
                        >
                          {dateMap?.map((date: any) => {
                            const { date: formattedDate, day } =
                              formatDate(date);
                            return (
                              <TableCell
                                key={formattedDate}
                                className="p-0 w-16 flex items-center px-2 py-3 border-r"
                              >
                                <Typography
                                  variant="p"
                                  className="!text-[15px]  !font-semibold"
                                >
                                  {day}
                                </Typography>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-b">
                {res?.map((row: any) => {
                  return (
                    <TableRow className="grid grid-flow-row-dense grid-cols-11 [&_td:first-child]:hover:underline [&_td:first-child]:hover:text-accent">
                      <TableCell className="p-2 col-span-3 px-3 flex items-center ">
                        <Typography
                          variant="p"
                          className="sm:text-sm !font-medium"
                        >
                          {row.employee_name}
                        </Typography>
                      </TableCell>
                      {dates?.map((item: any) => {
                        return <Cell item={item} row={row} />;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          {state.isAddTimeDialogOpen && (
            <AddTimeDialog
              state={state}
              closeAction={onClose}
              submitAction={onSubmit}
            />
          )}
          {state.isEditTimeDialogOpen && (
            <EditTimeDialog state={state} closeAction={onClose} />
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
