import { getTodayDate, formatDate, addDays } from "@/app/lib/utils";
import { useReducer } from "react";
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
import { setEmployeeWeekList } from "@/app/state/employeeList";
import { Button } from "@/components/ui/button";
import { Cell } from "./components/Cell";
import { debounce } from "lodash";
import { getInitialState, reducer } from "@/app/reducer/employeeList";

export default function CompactView() {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const projects = useSelector((state: RootState) => state.projects);
  const departments = useSelector((state: RootState) => state.departments);
  const employeeList = useSelector((state: RootState) => state.employeeList);
  const dispatch = useDispatch();

  const [state, stateDispatch] = useReducer(reducer, getInitialState);

  const {
    data: weekData,
    isLoading,
    mutate,
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
    stateDispatch({ type: "SetFetching", payload: true });

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

    stateDispatch({ type: "SetFetching", payload: false });
  }, []);

  useEffect(() => {
    if (weekData && !isLoading) {
      dispatch(setEmployeeWeekList(weekData?.message));
    }
  }, [weekData, isLoading]);

  useEffect(() => {
    if (state.weekDate == getTodayDate() && !employeeList) return;
    mutate({
      date: state.weekDate,
      employee_name: state.employeeName,
      department: state.selectedDepartment,
      project: state.selectedProject,
    });
  }, [
    state.weekDate,
    state.employeeName,
    state.selectedDepartment,
    state.selectedProject,
  ]);

  useEffect(() => {
    if (!employeeList) return;
    const dates = employeeList.dates;
    stateDispatch({
      type: "SetHeading",
      payload: { curentHeading: dates[1]?.key, prevHeading: dates[0]?.key },
    });
  }, [employeeList]);

  const handleprevWeek = () => {
    const date = addDays(state.weekDate, -14);
    stateDispatch({ type: "SetWeekDate", payload: date });
  };
  const handlenextWeek = () => {
    const date = addDays(state.weekDate, 14);
    stateDispatch({ type: "SetWeekDate", payload: date });
  };
  const setSelectedDepartment = (data: any) => {
    stateDispatch({ type: "SetDepartment", payload: data });
  };
  const setSelectedProject = (data: any) => {
    stateDispatch({ type: "SetProject", payload: data });
  };
  const onEmployeeNameInputChange = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      stateDispatch({ type: "SetEmployeeName", payload: e.target.value });
    },
    1000
  );
  if (state.isFetching || isLoading || !weekData) {
    return <div>Loading...</div>;
  }
  const dates = employeeList?.dates;
  const res = employeeList?.data;

  return (
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
        <div className="flex items-center col-span-4 text-center w-full">
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
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="grid grid-cols-11 w-full border-t">
              <TableHead className=" flex items-center col-span-3">
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
                      className={`flex h-full !border-b-0 w-full ${
                        item.key != "This Week" ? "bg-primary" : ""
                      }`}
                    >
                      {dateMap?.map((date: any) => {
                        const { date: formattedDate, day } = formatDate(date);
                        return (
                          <TableCell
                            key={formattedDate}
                            className="p-0  w-14 max-w-14 flex items-center px-2 py-3"
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
                <TableRow className="grid  grid-flow-row-dense grid-cols-11">
                  <TableCell className="p-2 col-span-3 px-3 flex items-center hover:text-accent hover:underline">
                    <Typography variant="p" className="sm:text-sm !font-medium">
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
      </div>
    </div>
  );
}
