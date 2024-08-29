import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, CircleCheck, Hourglass, CircleX } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { RootState } from "@/store";
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
  setFilters,
} from "@/store/team";
import { useToast } from "@/app/components/ui/use-toast";
import {
  parseFrappeErrorMsg,
  prettyDate,
  floatToTime,
  getFormatedDate,
  cn,
  calculateWeeklyHour,
  preProcessLink,
} from "@/lib/utils";
import { useEffect, useCallback, useState } from "react";
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
import { WorkingFrequency } from "@/types";
import { useQueryParamsState } from "@/lib/queryParam";
import { ProjectProps } from "@/types";
import { Input } from "@/app/components/ui/input";

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
  const [employee, setEmployee] = useState(employeeNameParam);
  useEffect(() => {
    const payload = {
      project: projectParam,
      userGroup: userGroupParam,
      statusFilter: statusParam,
    };
    dispatch(setFilters(payload));
  }, []);

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
    }
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
    }
  );

  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.team.get_compact_view_data", {
    date: teamState.weekDate,
    max_week: 1,
    page_length: 20,
    project: teamState.project,
    user_group: teamState.userGroup,
    start: teamState.start,
    status_filter: teamState.statusFilter,
  });

  const approvals = [
    { label: "Not Submitted", value: "Not Submitted" },
    { label: "Approval Pending", value: "Approval Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Partially Approved", value: "Partially Approved" },
    { label: "Partially Rejected", value: "Partially Rejected" },
  ];

  useEffect(() => {
    if (teamState.isFetchAgain) {
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
  }, [data, error, teamState.isFetchAgain]);

  useEffect(() => {
    if (teamState.projectSearch !== "") {
      projectMutate();
    }
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
    if (teamState.userGroupSearch !== "") {
      userGroupMutate();
    }
    if (groupError) {
      const err = parseFrappeErrorMsg(groupError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamState.userGroupSearch, groupError]);

  useEffect(() => {
    setProjectParam(teamState.project);
  }, [setProjectParam, teamState.project]);

  useEffect(() => {
    setStatusParam(teamState.statusFilter);
  }, [setStatusParam, teamState.statusFilter]);

  useEffect(() => {
    setUserGroupParam(teamState.userGroup);
  }, [setUserGroupParam, teamState.userGroup]);

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
    },
    [dispatch]
  );

  const handleUserGroupChange = useCallback(
    (value: string | string[]) => {
      dispatch(setUsergroup(value as string[]));
    },
    [dispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setStatusFilter(normalizedFilters));
    },
    [dispatch]
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
    dispatch(setDateRange({ dateRange: data, employee, isAprrovalDialogOpen: true }));
  };
  const onProjectSearch = useCallback(
    (searchTerm: string) => {
      dispatch(setProjectSearch(searchTerm));
    },
    [dispatch]
  );

  const onUserGroupSearch = useCallback(
    (searchTerm: string) => {
      dispatch(setUserGroupSearch(searchTerm));
    },
    [dispatch]
  );

  if (isLoading) return <Spinner isFull />;

  return (
    <>
      <div className="flex gap-x-2 items-center justify-between mb-3">
        {teamState.isAprrovalDialogOpen && <Approval />}
        <div id="filters" className="flex gap-x-2 max-md:gap-x-5 max-md:w-4/5 max-md:overflow-scroll">
          <Input
            placeholder="Employee name"
            value={employee}
            className="placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800"
            
          />
          <ComboxBox
            value={teamState.statusFilter}
            label="Approval"
            data={approvals}
            isMulti
            onSelect={handleStatusChange}
            leftIcon={<Filter className={cn("h-4 w-4", teamState.statusFilter.length != 0 && "fill-primary")} />}
            rightIcon={
              teamState.statusFilter.length > 0 && <Badge className="px-1.5">{teamState.statusFilter.length}</Badge>
            }
            className="text-primary border-dashed gap-x-1 font-normal w-fit"
          />
          <ComboxBox
            value={teamState.project}
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
            value={teamState.userGroup}
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
        <div id="date-filter" className="flex gap-x-2">
          <Button title="prev" className="p-1 h-fit" variant="outline" onClick={handleprevWeek}>
            <ChevronLeft className="w-4 max-md:w-3 h-4 max-md:h-3" />
          </Button>
          <Button title="next" className="p-1 h-fit" variant="outline" onClick={handlenextWeek}>
            <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />
          </Button>
        </div>
      </div>
      <div className="overflow-y-scroll mb-2 " style={{ height: "calc(100vh - 8rem)" }}>
        <Table>
          <TableHeader>
            <TableRow className="flex items-center w-full">
              <TableHead className="w-full max-w-md flex items-center">Members</TableHead>
              {teamState.data?.dates.map((item: DateProps) => {
                return item?.dates?.map((date) => {
                  const { date: dateStr, day } = prettyDate(date);
                  return (
                    <TableHead key={date} className="flex flex-col max-w-20 w-full text-center">
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
                <CircleCheck className="w-4 h-4" />
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
                            <span
                              className="flex  gap-x-2 items-center font-normal hover:underline w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`${TEAM}${EMPLOYEE}/${item.name}`);
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={decodeURIComponent(item.image)} />
                                <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                              </Avatar>
                              <Typography
                                variant="p"
                                className="w-full text-left text-ellipsis whitespace-nowrap overflow-hidden "
                              >
                                {item.employee_name}
                              </Typography>
                            </span>
                          </TableCell>
                          {item.data.map((data: dataItem, key) => {
                            total += data.hour;
                            return (
                              <HoverCard key={`${data.hour}-id-${Math.random()}`} openDelay={0}>
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
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleLoadMore} disabled={!teamState.hasMore}>
          Load More
        </Button>
        <Typography variant="p" className="px-5 font-semibold">
          {`${Object.keys(teamState.data.data).length | 0} of ${data?.message?.total_count | 0}`}
        </Typography>
      </div>
    </>
  );
};

const Status = ({ status }: { status: string }) => {
  if (status === "Approval Pending") {
    return <Hourglass className="w-4 h-4 stroke-warning " />;
  }
  if (status === "Approved" || status === "Partially Approved") {
    return <CircleCheck className="w-4 h-4 stroke-success" />;
  }
  if (status === "Rejected" || status === "Partially Rejected") {
    return <CircleX className="w-4 h-4 stroke-destructive" />;
  }
  return <CircleCheck className="w-4 h-4 " />;
};
export default Team;

const WeekTotal = ({
  total,
  expected_hour,
  frequency,
}: {
  total: number;
  expected_hour: number;
  frequency: WorkingFrequency;
}) => {
  const expectedTime = calculateWeeklyHour(total, expected_hour, frequency);
  return (
    <TableCell
      className={cn(
        "w-full max-w-24 flex items-center justify-end",
        expectedTime == 1 && "text-success",
        expectedTime == 2 && "text-warning",
        expectedTime == 0 && "text-destructive"
      )}
    >
      {floatToTime(total)}
    </TableCell>
  );
};
