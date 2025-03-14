/**
 * External dependencies.
 */
import { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Typography,
  Avatar,
  AvatarFallback,
  AvatarImage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Skeleton,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { preProcessLink, floatToTime } from "@next-pms/design-system/utils";
import { useInfiniteScroll } from "@next-pms/hooks";
import { isToday } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { mergeClassNames, parseFrappeErrorMsg, calculateExtendedWorkingHour } from "@/lib/utils";
import { dataItem } from "@/types/team";
import { Header } from "./header";
import { initialState, homeReducer } from "./reducer";
import type { DataItem, DateProps } from "./types";

const Home = () => {
  const { toast } = useToast();
  const [homeState, dispatch] = useReducer(homeReducer, initialState);
  const navigate = useNavigate();

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.team.get_compact_view_data",
    {
      date: homeState.weekDate,
      employee_name: homeState.employeeName,
      page_length: homeState.pageLength,
      start: homeState.start,
      status: homeState.status,
    },
    "next_pms.timesheet.api.team.get_compact_view_data_home_page",
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (homeState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch({ type: "SET_REFETCH_DATA", payload: false });
    }
  }, [mutate, homeState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (homeState.action == "SET") {
        dispatch({ type: "SET_DATA", payload: data.message });
      } else {
        dispatch({ type: "UPDATE_DATA", payload: data.message });
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
  }, [data, error]);

  const handleLoadMore = () => {
    if (homeState.isLoading) return;
    if (!homeState.data.hasMore) return;
    dispatch({ type: "SET_START", payload: homeState.start + homeState.pageLength });
  };

  const cellRef = useInfiniteScroll({
    isLoading: homeState.isLoading,
    hasMore: homeState.data.hasMore,
    next: handleLoadMore,
  });

  return (
    <>
      <Header homeState={homeState} dispatch={dispatch} />
      {isLoading ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_tr]:pr-3 relative">
          <TableHeader className="border-t-0 sticky top-0 w-full z-10 [&_tr]:border-b-0 [&_th]:py-0 group">
            <TableRow className="group-hover:bg-muted/50 ">
              <TableHead className="max-w-sm min-w-96 h-fit"></TableHead>
              <TableHead colSpan={7} className="h-fit ">
                <Typography variant="p" className="w-full flex  justify-center items-center">
                  {homeState.data?.dates[0]?.key}
                </Typography>
              </TableHead>
              <TableHead colSpan={7} className="h-fit divide-solid bg-slate-200">
                <Typography variant="p" className="w-full flex justify-center items-center">
                  {homeState.data?.dates[1]?.key}
                </Typography>
              </TableHead>
            </TableRow>
            <TableRow className="group-hover:bg-muted/50">
              <TableHead className="max-w-sm min-w-96 h-8"></TableHead>
              {homeState.data?.dates?.map((item: DateProps, index: number) => {
                const dates = item.dates;
                return dates.map((date: string) => {
                  const formattedDate = prettyDate(date);
                  return (
                    <TableHead
                      key={`${index}-${date}`}
                      className={mergeClassNames(
                        "text-slate-600 font-medium max-w-20 h-8",
                        index != 0 && "bg-slate-200",
                        isToday(date) && "bg-slate-300"
                      )}
                    >
                      {formattedDate.day}
                    </TableHead>
                  );
                });
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(homeState.data?.data).length > 0 ? (
              Object.entries(homeState.data?.data as Record<string, DataItem>).map(
                ([key, item]: [string, DataItem], index: number) => {
                  const needToAddRef = homeState.data.hasMore && index == Object.keys(homeState.data?.data).length - 2;
                  return (
                    <TableRow key={key} ref={needToAddRef ? cellRef : null}>
                      <TableCell className="flex items-center gap-x-2 max-w-sm min-w-96">
                        <span
                          className="flex gap-x-2 items-center font-normal hover:underline hover:cursor-pointer w-full"
                          onClick={() => {
                            navigate(`${TEAM}${EMPLOYEE}/${item.name}`);
                          }}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={decodeURIComponent(item.image)} alt={item.employee_name} />
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
                      {item.data.map((data: dataItem, index: number) => {
                        const expectedTime = calculateExtendedWorkingHour(
                          data.hour,
                          item.working_hour,
                          item.working_frequency
                        );

                        return (
                          <HoverCard key={`${data.hour}-id-${Math.random()}`} openDelay={1000}>
                            <TableCell
                              className={mergeClassNames(
                                "text-xs hover:cursor-pointer bg-transparent",
                                expectedTime == 2 && "bg-warning/20",
                                expectedTime == 1 && "bg-success/20",
                                expectedTime == 0 && data.hour != 0 && "bg-destructive/20",
                                data.is_leave && "bg-gray-200",
                                isToday(data.date) && "bg-slate-50",
                                data.hour == 0 && "text-center"
                              )}
                              key={`${key}-${index}`}
                            >
                              <HoverCardTrigger>{data.hour > 0 ? floatToTime(data.hour) : "-"}</HoverCardTrigger>
                              {data.note && (
                                <HoverCardContent className="text-sm text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
                                  <p dangerouslySetInnerHTML={{ __html: preProcessLink(data.note) }}></p>
                                </HoverCardContent>
                              )}
                            </TableCell>
                          </HoverCard>
                        );
                      })}
                    </TableRow>
                  );
                }
              )
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}

            {homeState?.data && homeState.data.hasMore && (
              <TableRow>
                <TableCell colSpan={15} className="text-center p-0">
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default Home;
