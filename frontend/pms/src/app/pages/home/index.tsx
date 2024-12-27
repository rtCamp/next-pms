/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isToday } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */

import { LoadMore } from "@/app/components/loadMore";
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import { Footer } from "@/app/layout/root";
import { TEAM, EMPLOYEE } from "@/lib/constant";

import {
  cn,
  parseFrappeErrorMsg,
  prettyDate,
  floatToTime,
  calculateExtendedWorkingHour,
  preProcessLink,
} from "@/lib/utils";
import { RootState } from "@/store";
import { setData, DateProps, setStart, updateData } from "@/store/home";
import { WorkingFrequency } from "@/types";
import { dataItem } from "@/types/team";
import { Header } from "./Header";

type DataItem = {
  data: dataItem[];
  name: string;
  image: string;
  employee_name: string;
  working_hour: number;
  working_frequency: WorkingFrequency;
  status: string;
};
const Home = () => {
  const { toast } = useToast();
  const homeState = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { data, error, isLoading } = useFrappeGetCall("next_pms.timesheet.api.team.get_compact_view_data", {
    date: homeState.weekDate,
    employee_name: homeState.employeeName,
    page_length: homeState.pageLength,
    start: homeState.start,
    status: homeState.status,
  });
  useEffect(() => {
    if (data) {
      if (homeState.action == "SET") {
        dispatch(setData(data.message));
      } else {
        dispatch(updateData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, dispatch, error, homeState.action, toast]);

  const handleLoadMore = useCallback(() => {
    if (!homeState.data.has_more) return;
    dispatch(setStart(homeState.start + homeState.pageLength));
  }, [dispatch, homeState.data.has_more, homeState.pageLength, homeState.start]);

  return (
    <>
      <Header />
      {isLoading && Object.keys(homeState.data.data).length == 0 ? (
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
                      className={cn(
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
                ([key, item]: [string, DataItem]) => {
                  return (
                    <TableRow key={key}>
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
                              className={cn(
                                "text-xs hover:cursor-pointer bg-transparent",
                                expectedTime == 2 && "bg-warning/40",
                                expectedTime == 1 && "bg-success/20",
                                expectedTime == 0 && data.hour != 0 && "bg-destructive/10",
                                data.is_leave && "bg-warning/20",
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
          </TableBody>
        </Table>
      )}
      <Footer>
        <div className="w-full flex justify-between items-center">
          <LoadMore
            variant="outline"
            onClick={handleLoadMore}
            disabled={
              Object.keys(homeState.data.data).length == homeState.data.total_count ||
              (isLoading && Object.keys(homeState.data.data).length != 0)
            }
          />

          <Typography variant="p" className="lg:px-5 font-semibold">
            {`${Object.keys(homeState.data.data).length | 0} of ${homeState.data.total_count | 0}`}
          </Typography>
        </div>
      </Footer>
    </>
  );
};

export default Home;
