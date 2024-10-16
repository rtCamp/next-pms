import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, CircleCheck, Hourglass, CircleX } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { RootState } from "@/store";
import { Header, Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import {
  setData,
  setFetchAgain,
  setWeekDate,
  setProject,
  setStart,
  updateData,
  setDateRange,
  setUsergroup,
  setUserGroupSearch,
  setProjectSearch,
  setStatusFilter,
  setEmployeeName,
  setReportsTo,
  setFilters,
  setStatus,
  setEmployee,
} from "@/store/team";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg, prettyDate, floatToTime, getFormatedDate, cn, preProcessLink } from "@/lib/utils";
import { useEffect, useCallback } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Employee } from "./employee";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Approval } from "./approval";
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { ItemProps, dataItem } from "@/types/team";
import { Spinner } from "@/app/components/spinner";
import { WeekTotal } from "@/app/components/timesheetTable";
import { useQueryParamsState } from "@/lib/queryParam";
import { ProjectProps } from "@/types";
import { DeBounceInput } from "@/app/components/deBounceInput";
import EmployeeCombo from "@/app/components/employeeComboBox";

type UserGroupProps = {
  name: string;
};
type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: Array<string>;
};

const Team = () => {
  const { toast } = useToast();
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [projectParam, setProjectParam] = useQueryParamsState<string[]>("project", []);
  const [userGroupParam, setUserGroupParam] = useQueryParamsState<string[]>("user-group", []);
  const [statusParam, setStatusParam] = useQueryParamsState<string[]>("status", []);
  const [employeeNameParam, setEmployeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [reportsToParam, setReportsToParam] = useQueryParamsState<string>("reports-to", "");
  const [employeeStatusParam, setEmployeeStatusParam] = useQueryParamsState<Array<string>>("emp-status", []);

  const approvalsData = [
    { label: "Not Submitted", value: "Not Submitted" },
    { label: "Approval Pending", value: "Approval Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Partially Approved", value: "Partially Approved" },
    { label: "Partially Rejected", value: "Partially Rejected" },
  ];
  const empStatus = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
    { label: "Suspended", value: "Suspended" },
    { label: "Left", value: "Left" },
  ];
  useEffect(() => {
    const payload = {
      project: projectParam,
      userGroup: userGroupParam,
      statusFilter: statusParam,
      employeeName: employeeNameParam,
      reportsTo: reportsToParam,
      status: employeeStatusParam,
    };
    dispatch(setFilters(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, mutate, isLoading, isValidating, error } = useFrappeGetCall(
    "frappe_pms.timesheet.api.team.get_compact_view_data",
    {
      date: teamState.weekDate,
      max_week: 1,
      page_length: 20,
      employee_name: teamState.employeeName,
      project: teamState.project,
      user_group: teamState.userGroup,
      start: teamState.start,
      status_filter: teamState.statusFilter,
      reports_to: teamState.reportsTo,
      status: teamState.status,
    },
    undefined,
    {
      shouldRetryOnError: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

  const {
    data: projects,
    mutate: projectMutate,
    error: projectError,
  } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project",
      fields: ["name", "project_name"],
      or_filters: [
        ["name", "like", `%${teamState.projectSearch}%`],
        ["project_name", "like", `%${teamState.projectSearch}%`],
      ],
    },
    "projects",
    {
      shouldRetryOnError: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

  const {
    data: userGroups,
    error: groupError,
    mutate: userGroupMutate,
  } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "User Group",
      or_filters: [["name", "like", `%${teamState.userGroupSearch}%`]],
    },
    "user_group",
    {
      shouldRetryOnError: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

  useEffect(() => {
    if (teamState.isFetchAgain == true) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (Object.keys(teamState.data.data).length > 0 && teamState.data.dates.length > 0) {
        dispatch(updateData(data.message));
      } else {
        dispatch(setData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamState.isFetchAgain, data, error]);

  useEffect(() => {
    projectMutate();
    if (projectError) {
      const err = parseFrappeErrorMsg(projectError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamState.projectSearch, projectError]);

  useEffect(() => {
    if (employeeNameParam !== "") {
      dispatch(setEmployeeName(employeeNameParam));
    }
  }, [dispatch, employeeNameParam]);

  useEffect(() => {
    userGroupMutate();
    if (groupError) {
      const err = parseFrappeErrorMsg(groupError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamState.userGroupSearch, groupError]);

  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, -6));
    dispatch(setWeekDate(date));
  }, [dispatch, teamState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, 6));
    dispatch(setWeekDate(date));
  }, [dispatch, teamState.weekDate]);

  const handleProjectChange = useCallback(
    (value: string | string[]) => {
      dispatch(setProject(value as string[]));
      setProjectParam(value as string[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  const handleUserGroupChange = useCallback(
    (value: string | string[]) => {
      dispatch(setUsergroup(value as string[]));
      setUserGroupParam(value as string[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setStatusFilter(normalizedFilters));
      setStatusParam(normalizedFilters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );
  const handleLoadMore = () => {
    if (!teamState.hasMore) return;
    dispatch(setStart(teamState.start + 20));
  };
  const onStatusClick = (start_date: string, end_date: string, employee: string) => {
    const data = {
      start_date,
      end_date,
    };
    dispatch(setEmployee(employee));
    dispatch(setDateRange({ dateRange: data, isAprrovalDialogOpen: true }));
  };
  const onProjectSearch = useCallback(
    (searchTerm: string) => {
      dispatch(setProjectSearch(searchTerm));
    },
    [dispatch],
  );

  const onUserGroupSearch = useCallback(
    (searchTerm: string) => {
      dispatch(setUserGroupSearch(searchTerm));
    },
    [dispatch],
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
      setEmployeeNameParam(e.target.value);
    },
    [dispatch, setEmployeeNameParam],
  );
  const handleEmployeeStatusChange = useCallback(
    (value: string | string[]) => {
      dispatch(setStatus(value as string[]));
      setEmployeeStatusParam(value as string[]);
    },
    [dispatch, setEmployeeStatusParam],
  );
  const handleReportsToChange = useCallback(
    (name: string) => {
      dispatch(setReportsTo(name));
      setReportsToParam(name);
    },
    [dispatch, setReportsToParam],
  );
  return (
    <>
      {teamState.isAprrovalDialogOpen && <Approval />}
      <Header className="flex items-center max-md:flex-col">
        <div id="filters" className="flex gap-x-2 max-md:gap-x-5  overflow-y-hidden max-md:w-full items-center">
          <DeBounceInput
            placeholder="Employee name"
            value={employeeNameParam}
            deBounceValue={400}
            className="max-w-40 min-w-40 m-1"
            callback={handleEmployeeChange}
          />
          <EmployeeCombo
            value={reportsToParam}
            label="Reporting Manager"
            onSelect={handleReportsToChange}
            className="border-dashed min-w-48 w-full max-w-48"
          />
          <ComboxBox
            value={employeeStatusParam}
            label="Employee Status"
            data={empStatus}
            shouldFilter
            isMulti
            onSelect={handleEmployeeStatusChange}
            leftIcon={<Filter className={cn("h-4 w-4", teamState.status.length != 0 && "fill-primary")} />}
            rightIcon={teamState.status.length > 0 && <Badge className="px-1.5">{teamState.status.length}</Badge>}
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <ComboxBox
            value={statusParam}
            label="Approval"
            data={approvalsData}
            isMulti
            shouldFilter
            onSelect={handleStatusChange}
            leftIcon={<Filter className={cn("h-4 w-4", teamState.statusFilter.length != 0 && "fill-primary")} />}
            rightIcon={
              teamState.statusFilter.length > 0 && <Badge className="px-1.5">{teamState.statusFilter.length}</Badge>
            }
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <ComboxBox
            value={projectParam}
            label="Projects"
            isMulti
            showSelected={false}
            onSelect={handleProjectChange}
            onSearch={onProjectSearch}
            rightIcon={teamState.project.length > 0 && <Badge className="px-1.5">{teamState.project.length}</Badge>}
            leftIcon={<Filter className={cn("h-4 w-4", teamState.project.length != 0 && "fill-primary")} />}
            data={projects?.message.map((item: ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            }))}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
          />
          <ComboxBox
            value={userGroupParam}
            label="User Groups"
            onSearch={onUserGroupSearch}
            showSelected={false}
            data={userGroups?.message.map((item: UserGroupProps) => ({
              label: item.name,
              value: item.name,
            }))}
            rightIcon={teamState.userGroup.length > 0 && <Badge className="px-1.5">{teamState.userGroup.length}</Badge>}
            isMulti
            leftIcon={<Filter className={cn("h-4 w-4", teamState.userGroup.length != 0 && "fill-primary")} />}
            onSelect={handleUserGroupChange}
            className="text-primary border-dashed gap-x-2 font-normal w-fit"
          />
        </div>
        <div id="date-filter" className="flex gap-x-2 max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2 t">
          <Button title="prev" className="p-1 h-fit" variant="outline" onClick={handleprevWeek}>
            <ChevronLeft className="w-4 max-md:w-3 h-4 max-md:h-3" />
          </Button>
          <Button title="next" className="p-1 h-fit" variant="outline" onClick={handlenextWeek}>
            <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />
          </Button>
        </div>
      </Header>
      {(isLoading || isValidating) && Object.keys(teamState.data.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="lg:[&_tr]:pr-3 relative">
          <TableHeader className="border-t-0 sticky top-0 z-10">
            <TableRow className="flex items-center w-full">
              <TableHead className="w-full max-w-md flex items-center">Members</TableHead>
              {teamState.data?.dates.map((item: DateProps) => {
                return item?.dates?.map((date) => {
                  const { date: dateStr, day } = prettyDate(date);
                  return (
                    <TableHead key={date} className="flex flex-col max-w-20 w-full items-center justify-center">
                      <Typography variant="p" className="text-slate-600">
                        {day}
                      </Typography>
                      <Typography variant="small" className="text-slate-500 max-lg:text-[0.65rem]">
                        {dateStr}
                      </Typography>
                    </TableHead>
                  );
                });
              })}
              <TableHead className="w-full max-w-24 flex items-center justify-end">Total</TableHead>
              <TableHead className="w-full max-w-20 flex items-center justify-center">
                <CircleCheck />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            {Object.entries(teamState.data?.data).map(([key, item]: [string, ItemProps]) => {
              let total = 0;
              return (
                <TableRow key={key} className="flex items-center w-full">
                  <Accordion type="multiple" key={key} className="w-full">
                    <AccordionItem value={key} className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-0">
                        <span className="w-full flex ">
                          <TableCell className="w-full min-w-24 max-w-md overflow-hidden">
                            <span className="flex  gap-x-2 items-center font-normal hover:underline w-full">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={decodeURIComponent(item.image)} />
                                <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                              </Avatar>
                              <Typography
                                variant="p"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`${TEAM}${EMPLOYEE}/${item.name}`);
                                }}
                                className="text-left text-ellipsis whitespace-nowrap overflow-hidden "
                              >
                                {item.employee_name}
                              </Typography>
                            </span>
                          </TableCell>
                          {item.data.map((data: dataItem, key) => {
                            total += data.hour;
                            return (
                              <HoverCard key={`${data.hour}-id-${Math.random()}`} openDelay={1000}>
                                <TableCell key={key} className={cn("flex max-w-20 w-full justify-center items-center")}>
                                  <HoverCardTrigger>
                                    <Typography
                                      className={cn(data.is_leave && "text-warning", data.hour == 0 && "text-primary")}
                                      variant="p"
                                    >
                                      {data.hour ? floatToTime(data.hour) : "-"}
                                    </Typography>
                                  </HoverCardTrigger>
                                  {data.note && (
                                    <HoverCardContent className="text-sm font-normal text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
                                      <p dangerouslySetInnerHTML={{ __html: preProcessLink(data.note) }}></p>
                                    </HoverCardContent>
                                  )}
                                </TableCell>
                              </HoverCard>
                            );
                          })}

                          <WeekTotal
                            total={total}
                            expected_hour={item.working_hour}
                            frequency={item.working_frequency}
                            className="w-full max-w-24 flex items-center justify-end"
                          />

                          <TableCell
                            className="w-full max-w-16 flex items-center justify-end"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusClick(item.data[0].date, item.data[item.data.length - 1].date, item.name);
                            }}
                          >
                            <Status status={item.status} />
                          </TableCell>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <Employee employee={item.name} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TableRow>
              );
            })}
            {Object.entries(teamState.data?.data).length == 0 && (
              <TableRow>
                <TableCell colSpan={15} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <Footer>
        <div className="flex justify-between items-center">
          <LoadMore
            variant="outline"
            onClick={handleLoadMore}
            disabled={
              !teamState.hasMore || ((isLoading || isValidating) && Object.keys(teamState.data.data).length != 0)
            }
          />
          <Typography variant="p" className="lg:px-5 font-semibold">
            {`${Object.keys(teamState.data.data).length | 0} of ${teamState.data.total_count | 0}`}
          </Typography>
        </div>
      </Footer>
    </>
  );
};

export const Status = ({ status, className }: { status: string; className?: string }) => {
  if (status === "Approval Pending") {
    return <Hourglass className={cn("w-4 h-4 stroke-warning", className)} />;
  }
  if (status === "Approved" || status === "Partially Approved") {
    return <CircleCheck className={cn("w-4 h-4 stroke-success", className)} />;
  }
  if (status === "Rejected" || status === "Partially Rejected") {
    return <CircleX className={cn("w-4 h-4 stroke-destructive", className)} />;
  }
  return <CircleCheck className={cn("w-4 h-4", className)} />;
};
export default Team;
