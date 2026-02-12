/**
 * External dependencies.
 */
import { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  Skeleton,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Spinner,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  TextEditor,
} from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { floatToTime } from "@next-pms/design-system/utils";
import { useInfiniteScroll } from "@next-pms/hooks";
import { useFrappeGetCall, useFrappeEventListener } from "frappe-react-sdk";
import { CircleCheck } from "lucide-react";
/**
 * Internal dependencies.
 */
import CustomViewWrapper from "@/app/components/customViewWrapper";
import { WeekTotal } from "@/app/components/timesheet-table/components/weekTotal";
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { parseFrappeErrorMsg, mergeClassNames } from "@/lib/utils";
import { DateProps, ItemProps, dataItem } from "@/types/team";
import { Approval } from "./components/approval";
import { EmployeeTimesheetTable } from "./components/employeeTimesheetTable";
import { Header } from "./components/header";
import { StatusIndicator } from "./components/statusIndicator";
import { TeamComponentProps, TeamState } from "./employee-detail/types";
import { initialState, reducer } from "./reducer";
import { createFilter } from "./utils";

const Team = () => {
  return (
    <CustomViewWrapper
      label="Team"
      createFilter={createFilter({} as TeamState)}
    >
      {({ viewData }) => <TeamComponent viewData={viewData} />}
    </CustomViewWrapper>
  );
};

const TeamComponent = ({ viewData }: TeamComponentProps) => {
  const { toast } = useToast();
  const [teamState, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.team.get_compact_view_data",
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
    undefined,
    {
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
      errorRetryCount: 1,
    },
  );

  useEffect(() => {
    if (teamState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch({ type: "SET_REFETCH_DATA", payload: false });
    }
  }, [dispatch, mutate, teamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (teamState.action == "SET") {
        dispatch({ type: "SET_DATA", payload: data.message });
      } else {
        dispatch({ type: "UPDATE_DATA", payload: data.message });
      }
    }
    if (error) {
      dispatch({ type: "SET_HAS_MORE", payload: false });
      dispatch({ type: "SET_LOADING", payload: false });
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  useFrappeEventListener(`timesheet_info`, (payload) => {
    const employee = payload.employee;
    const data = payload.message;
    if (!Object.prototype.hasOwnProperty.call(teamState.data.data, employee)) {
      return;
    }
    if (!teamState.data.dates[0]?.dates?.includes(payload.date)) {
      return;
    }
    dispatch({ type: "UPDATE_EMP_DATA", payload: data });
  });

  const handleLoadMore = () => {
    if (teamState.isLoading) return;
    if (!teamState.hasMore) return;
    dispatch({
      type: "SET_START",
      payload: teamState.start + teamState.pageLength,
    });
  };

  const onStatusClick = (
    startDate: string,
    endDate: string,
    employee: string,
  ) => {
    const data = {
      startDate,
      endDate,
    };
    dispatch({ type: "SET_EMPLOYEE", payload: employee });
    dispatch({
      type: "SET_DATE_RANGE",
      payload: { dateRange: data, isAprrovalDialogOpen: true },
    });
  };

  const cellRef = useInfiniteScroll({
    isLoading: teamState.isLoading,
    hasMore: teamState.hasMore,
    next: handleLoadMore,
  });

  return (
    <>
      {teamState.isAprrovalDialogOpen && (
        <Approval
          employee={teamState.employee}
          isAprrovalDialogOpen={teamState.isAprrovalDialogOpen}
          endDate={teamState.dateRange.endDate}
          startDate={teamState.dateRange.startDate}
          onClose={() => {
            mutate();
            dispatch({
              type: "SET_DATE_RANGE",
              payload: {
                dateRange: { startDate: "", endDate: "" },
                isAprrovalDialogOpen: false,
              },
            });
          }}
        />
      )}
      <Header teamState={teamState} dispatch={dispatch} viewData={viewData} />

      {isLoading && Object.keys(teamState.data.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="lg:[&_tr]:pr-3 relative">
          <TableHeader className="border-t-0 sticky top-0 z-10">
            <TableRow className="flex items-center w-full">
              <TableHead className="w-full max-w-md flex items-center text-primary">
                Members
              </TableHead>
              {teamState.data?.dates.map((item: DateProps) => {
                return item?.dates?.map((date) => {
                  const { date: dateStr, day } = prettyDate(date);
                  return (
                    <TableHead
                      key={date}
                      className="flex flex-col max-w-20 w-full items-center justify-center"
                    >
                      <Typography variant="p">{day}</Typography>
                      <Typography
                        variant="small"
                        className="text-slate-500 dark:text-primary/60 max-lg:text-[0.65rem]"
                      >
                        {dateStr}
                      </Typography>
                    </TableHead>
                  );
                });
              })}
              <TableHead className="w-full max-w-24 flex items-center justify-end text-primary">
                Total
              </TableHead>
              <TableHead className="w-full max-w-20 flex items-center justify-center text-primary">
                <CircleCheck />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            {Object.entries(teamState.data?.data).map(
              ([key, item]: [string, ItemProps], index: number) => {
                let total = 0;

                const needToAddRef =
                  teamState.hasMore &&
                  index == Object.keys(teamState.data?.data).length - 2;

                return (
                  <TableRow
                    key={key}
                    ref={needToAddRef ? cellRef : null}
                    className="flex items-center w-full"
                  >
                    <Accordion type="multiple" key={key} className="w-full">
                      <AccordionItem value={key} className="border-b-0">
                        <AccordionTrigger className="hover:no-underline py-0">
                          <span className="w-full flex ">
                            <TableCell className="w-full min-w-24 max-w-md overflow-hidden">
                              <span className="flex  gap-x-2 items-center font-normal hover:underline w-full">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage
                                    src={decodeURIComponent(item.image)}
                                  />
                                  <AvatarFallback>
                                    {item.employee_name[0]}
                                  </AvatarFallback>
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
                              const dateExists = teamState.data.dates.some(
                                (item) => item?.dates?.includes(data.date),
                              );
                              if (!dateExists) return <></>;
                              total += data.hour;
                              return (
                                <HoverCard
                                  key={`${data.hour}-id-${Math.random()}`}
                                  openDelay={1000}
                                >
                                  <TableCell
                                    key={key}
                                    className={mergeClassNames(
                                      "flex max-w-20 w-full justify-center items-center",
                                    )}
                                  >
                                    <HoverCardTrigger>
                                      <Typography
                                        className={mergeClassNames(
                                          data.is_leave && "text-warning",
                                          data.hour == 0 && "text-primary",
                                        )}
                                        variant="p"
                                      >
                                        {data.hour
                                          ? floatToTime(data.hour)
                                          : "-"}
                                      </Typography>
                                    </HoverCardTrigger>
                                    {data.note && (
                                      <HoverCardContent
                                        className="text-sm font-normal text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto hover-content"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <TextEditor
                                          onChange={() => {}}
                                          hideToolbar={true}
                                          readOnly={true}
                                          value={data.note}
                                        />
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
                                onStatusClick(
                                  item.data[0].date,
                                  item.data[item.data.length - 1].date,
                                  item.name,
                                );
                              }}
                            >
                              <StatusIndicator status={item.status} />
                            </TableCell>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <EmployeeTimesheetTable
                            teamState={teamState}
                            employee={item.name}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableRow>
                );
              },
            )}
            {Object.entries(teamState.data?.data).length == 0 && (
              <TableRow>
                <TableCell colSpan={15} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
            {teamState.hasMore && <Skeleton className="h-10 w-full" />}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default Team;
