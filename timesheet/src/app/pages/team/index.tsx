import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, CircleCheck, Hourglass, CircleX } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
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
} from "@/store/team";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg, prettyDate, floatToTime, getFormatedDate, cn, calculateWeeklyHour } from "@/lib/utils";
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
import { WorkingFrequency } from "@/types";
import { useQueryParamsState } from "@/lib/queryParam";

type ProjectProps = {
  project_name: string;
  name: string;
};
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
  });

  const approvals = [
    { label: "Not Submitted", value: "Not Submitted" },
    { label: "Approval Pending", value: "Approval Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
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
    if (projectParam.length > 0) {
      dispatch(setProject(projectParam));
    }
  }, [dispatch, projectParam]);

  useEffect(() => {
    if (userGroupParam.length > 0) {
      dispatch(setUsergroup(userGroupParam));
    }
  }, [dispatch, userGroupParam]);

  useEffect(() => {
    setProjectParam(teamState.project);
  }, [setProjectParam, teamState.project]);

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

  const handleLoadMore = () => {
    if (!teamState.hasMore) return;
    dispatch(setStart(teamState.start + 20));
    dispatch(setFetchAgain(true));
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
        <div id="filters" className="flex gap-x-2">
          <ComboxBox
            label="Approval"
            data={approvals}
            isMulti
            leftIcon={<Filter className={cn("h-4 w-4")} />}
            className="text-primary border-dashed gap-x-2 font-normal"
            disabled
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
            className="text-primary border-dashed gap-x-2 font-normal"
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
            rightIcon={teamState.userGroup.length > 0 && <Badge  className="px-1.5">{teamState.userGroup.length}</Badge>}
            isMulti
            leftIcon={<Filter className={cn("h-4 w-4", teamState.userGroup.length != 0 && "fill-primary")} />}
            onSelect={handleUserGroupChange}
            className="text-primary border-dashed gap-x-2 font-normal"
          />
        </div>
        <div id="date-filter" className="flex gap-x-2">
          <Button className="p-1 h-fit" variant="outline" onClick={handleprevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button className="p-1 h-fit" variant="outline" onClick={handlenextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-y-scroll mb-2" style={{ height: "calc(100vh - 8rem)" }}>
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
                      <Typography variant="small" className="text-slate-500">
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
                          <TableCell className="w-full max-w-md overflow-hidden">
                            <span
                              className="flex gap-x-2 items-center font-normal hover:underline w-full"
                              onClick={() => {
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
                              <TableCell key={key} className={cn("flex max-w-20 w-full justify-center items-center")}>
                                <Typography
                                  className={cn(data.is_leave && "text-warning", data.hour == 0 && "text-primary")}
                                  variant="p"
                                >
                                  {data.hour ? floatToTime(data.hour) : "-"}
                                </Typography>
                              </TableCell>
                            );
                          })}

                          <WeekTotal
                            total={total}
                            expected_hour={item.working_hour}
                            frequency={item.working_frequency}
                          />

                          <TableCell
                            className="w-full max-w-16 flex items-center justify-end"
                            onClick={() => {
                              item.status != "Approved" &&
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
          {`${Object.keys(data?.message?.data).length | 0} of ${data?.message?.total_count | 0}`}
        </Typography>
      </div>
    </>
  );
};

const Status = ({ status }: { status: string }) => {
  if (status === "Pending") {
    return <Hourglass className="w-4 h-4 stroke-warning " />;
  }
  if (status === "Approved") {
    return <CircleCheck className="w-4 h-4 stroke-success" />;
  }
  if (status === "Rejected") {
    return <CircleX className="w-4 h-4 stroke-error" />;
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
