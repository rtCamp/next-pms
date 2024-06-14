import {
  getTodayDate,
  getFormatedDate,
  cn,
  floatToTime,
  formatDate,
  addDays,
} from "@/app/lib/utils";
import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Type } from "lucide-react";
import {
  FrappeContext,
  FrappeConfig,
  useFrappeGetDocList,
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
import { debounce} from "lodash";

export default function CompactView() {
  const projects = useSelector((state: RootState) => state.projects);
  const departments = useSelector((state: RootState) => state.departments);
  const employeeList = useSelector((state: RootState) => state.employeeList);
  const dispatch = useDispatch();

  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [selectedDepartment, setSelectedDepartment] = useState([]);
  const [selectedProject, setSelectedProject] = useState([]);
  const [WeekDate, setWeekDate] = useState(getTodayDate());
  const [data, setData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [prevHeading, setPrevHeading] = useState<string>("");
  const [curentHeading, setCurrentHeading] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const {
    data: weekData,
    isLoading,
    mutate,
  } = useFrappeGetCall(
    "timesheet_enhancer.api.team.get_weekly_compact_view_data",
    {
      date: WeekDate,
    },
    "weekData",
    {
      dedupingInterval: 1000 * 60 * 10,
    }
  );

  useEffect(() => {
    setIsFetching(true);

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
        })
        .then((res) => {
          dispatch(setDepartment(res.message));
        });
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    if (weekData && !isLoading) {
      setData(weekData?.message);
      dispatch(setEmployeeWeekList(weekData?.message));
    }
  }, [weekData, isLoading]);

  useEffect(() => {
    if (WeekDate == getTodayDate() && !data) return;
    mutate({ date: WeekDate });
  }, [WeekDate]);

  useEffect(() => {
    if (!data) return;
    const dates = data.dates;
    setPrevHeading(dates[0]?.key);
    setCurrentHeading(dates[1]?.key);
  }, [data]);

  const handleprevWeek = () => {
    const date = addDays(WeekDate, -14);
    setWeekDate(date);
  };
  const handlenextWeek = () => {
    const date = addDays(WeekDate, 14);
    setWeekDate(date);
  };
  const onEmployeeNameInputChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  }, 1000);
  if (isFetching || isLoading || !weekData) {
    return <div>Loading...</div>;
  }
  const dates = data?.dates;
  const res = data?.data;
  console.log(selectedProject);
  return (
    <div>
      <div id="header" className="grid grid-cols-11 w-full">
        <div className="flex gap-2 pr-2 col-span-3">
          <MultiCombo
            comboData={departments.value.map((item) => ({
              value: item.name,
              label: item.department_name,
            }))}
            buttonLabel="Departments"
            parentCallback={setSelectedDepartment}
          />
          <MultiCombo
            comboData={projects.value.map((item) => ({
              value: item.name,
              label: item.project_name,
            }))}
            buttonLabel="Projects"
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
            {prevHeading}
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
            {curentHeading}
          </Typography>
        </div>
      </div>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="grid grid-cols-11 w-full border-t">
              <TableHead className=" flex items-center col-span-3">
                <Input placeholder="Employee name..." className="" onInput={onEmployeeNameInputChange} />
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
                            className="p-0  w-full max-w-14 flex items-center px-2 py-3"
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
