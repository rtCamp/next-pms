/**
 * External dependencies.
 */
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CircleCheck, Hourglass, CircleX } from "lucide-react";

/**
 * Internal dependencies.
 */

import { Spinner } from "@/app/components/spinner";
import { WeekTotal } from "@/app/components/TimesheetTable";
import { Typography } from "@/app/components/typography";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { parseFrappeErrorMsg, prettyDate, floatToTime, cn, preProcessLink } from "@/lib/utils";
import { RootState } from "@/store";
import { setData, setStart, updateData, setDateRange, setEmployee, setReFetchData } from "@/store/team";
import { ItemProps, dataItem } from "@/types/team";
import { Approval } from "./approval";
import { Employee } from "./employee";
import { Header } from "./Header";
import { useInfiniteScroll } from "../resource_management/hooks/useInfiniteScroll";
import { usePagination } from "../resource_management/hooks/usePagination";

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

  const getKey = (pageIndex: number, previousPageData: any) => {
    const indexTillNeedToFetchData = teamState.start == 0 ? 1 : teamState.start / teamState.pageLength;
    if (indexTillNeedToFetchData <= pageIndex) return null;
    if (previousPageData && !previousPageData.message.has_more) return null;

    return `next_pms.timesheet.api.team.get_compact_view_data/team?page=${pageIndex}&limit=${teamState.pageLength}`;
  };

  const { data, isLoading, error, size, setSize, mutate } = usePagination(
    "next_pms.timesheet.api.team.get_compact_view_data",
    getKey,
    {
      date: teamState.weekDate,
      max_week: 1,
      page_length: teamState.pageLength,
      employee_name: teamState.employeeName,
      project: teamState.project,
      user_group: teamState.userGroup,
      start: teamState.start,
      status_filter: teamState.statusFilter,
      reports_to: teamState.reportsTo,
      status: teamState.status,
    },
    {
      parallel: true,
      revalidateAll: true,
    }
  );

  useEffect(() => {
    if (teamState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, teamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    const newSize: number = teamState.start / teamState.pageLength + 1;
    if (newSize == size) {
      return;
    }
    setSize(newSize);
  }, [teamState.start, teamState.pageLength, size, setSize]);

  useEffect(() => {
    if (data) {
      if (teamState.action == "SET") {
        dispatch(setData(data[0].message));
      } else {
        dispatch(updateData(data[data.length - 1].message));
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
  }, [data, error, teamState.action]);

  const handleLoadMore = () => {
    if (teamState.isLoading) return;
    if (!teamState.hasMore) return;
    dispatch(setStart(teamState.start + teamState.pageLength));
  };

  const onStatusClick = (start_date: string, end_date: string, employee: string) => {
    const data = {
      start_date,
      end_date,
    };
    dispatch(setEmployee(employee));
    dispatch(setDateRange({ dateRange: data, isAprrovalDialogOpen: true }));
  };

  const cellRef = useInfiniteScroll({
    isLoading: teamState.isLoading,
    hasMore: teamState.hasMore,
    next: handleLoadMore,
  });

  return (
    <>
      {teamState.isAprrovalDialogOpen && <Approval onClose={mutate} />}
      <Header />

      {isLoading && Object.keys(teamState.data.data).length == 0 ? (
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
            {Object.entries(teamState.data?.data).map(([key, item]: [string, ItemProps], index: number) => {
              let total = 0;

              const needToAddRef = teamState.hasMore && index == Object.keys(teamState.data?.data).length - 2;

              return (
                <TableRow key={key} ref={needToAddRef ? cellRef : null} className="flex items-center w-full">
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
            {teamState.hasMore &&  <Skeleton className="h-10 w-full" />}
          </TableBody>
        </Table>
      )}
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
