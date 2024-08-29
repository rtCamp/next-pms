/* eslint-disable @typescript-eslint/no-explicit-any */
import { useToast } from "@/app/components/ui/use-toast";
import {
  cn,
  parseFrappeErrorMsg,
  prettyDate,
  floatToTime,
  deBounce,
  getFormatedDate,
  calculateExtendedWorkingHour,
  preProcessLink,
} from "@/lib/utils";
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setData,
  setFetchAgain,
  setWeekDate,
  setEmployeeName,
  DateProps,
  setStart,
  updateData,
  resetState,
} from "@/store/home";
import { Spinner } from "@/app/components/spinner";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { addDays, isToday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Input } from "@/app/components/ui/input";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";
import { dataItem } from "@/types/team";
import { useQueryParamsState } from "@/lib/queryParam";
import { useNavigate } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";

const Home = () => {
  const { toast } = useToast();
  const homeState = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch();
  const [employeeNameParam, setEmployeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [employee, setEmployee] = useState(employeeNameParam);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setEmployeeName(employeeNameParam));
    return () => {
      dispatch(resetState());
    };
  }, []);

  const { data, error, mutate, isLoading } = useFrappeGetCall("timesheet_enhancer.api.team.get_compact_view_data", {
    date: homeState.weekDate,
    employee_name: homeState.employeeName,
    page_length: 20,
    start: homeState.start,
  });
  useEffect(() => {
    if (homeState.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (Object.keys(homeState.data.data).length > 0) {
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
  }, [data, homeState.isFetchAgain, error]);
  useEffect(() => {
    if (employeeNameParam !== "") {
      dispatch(setEmployeeName(employeeNameParam));
    }
  }, [dispatch, employeeNameParam]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInputChange = useCallback(
    deBounce((e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
      setEmployeeNameParam(e.target.value);
    }, 700),
    [dispatch]
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmployee(e.target.value);
      onInputChange(e);
    },
    [onInputChange]
  );

  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, -14));
    dispatch(setWeekDate(date));
  }, [dispatch, homeState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, 14));
    dispatch(setWeekDate(date));
  }, [dispatch, homeState.weekDate]);

  const handleLoadMore = useCallback(() => {
    if (!homeState.data.has_more) return;
    dispatch(setStart(homeState.start + 20));
    dispatch(setFetchAgain(true));
  }, [dispatch, homeState.data.has_more, homeState.start]);

  return (
    <>
      <section id="filter-section" className="flex gap-x-3 mb-3">
        <div className="pr-4 max-md:pr-2 max-w-sm w-full max-md:w-3/6 max-sm:w-4/6">
          <Input
            placeholder="Employee name"
            value={employee}
            className="placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800 max-w-sm"
            onChange={handleEmployeeChange}
          />
        </div>
        <div className="w-full flex">
          <div className="grow flex items-center w-full">
            <Button title="prev" variant="outline" className="p-1 h-fit" onClick={handleprevWeek}>
              <ChevronLeft className="w-4 h-4 max-sm:w-3 max-sm:h-3" />
            </Button>
            <Typography className="w-full text-center  max-sm:text-sm  max-md:text-[2vw]" variant="h6">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {homeState.data.dates.length > 0 && homeState.data.dates[0].key}
            </Typography>
          </div>
          <div className="grow flex items-center w-full">
            <Typography className="w-full text-center  max-sm:text-sm max-md:text-[2vw]" variant="h6">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {homeState.data.dates.length > 0 && homeState.data.dates[1].key}
            </Typography>
            <Button title="next" variant="outline" className="p-1 h-fit" onClick={handlenextWeek}>
              <ChevronRight className="w-4 h-4 max-sm:w-3 max-sm:h-3" />
            </Button>
          </div>
        </div>
      </section>
      {isLoading ? (
        <Spinner isFull />
      ) : (
        <div className="overflow-y-scroll mb-2" style={{ height: "calc(100vh - 8rem)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-sm w-full"></TableHead>
                {homeState.data?.dates?.map((item: DateProps, index: number) => {
                  const dates = item.dates;
                  return dates.map((date: string) => {
                    const formattedDate = prettyDate(date);
                    return (
                      <TableHead
                        key={`${index}-${date}`}
                        className={cn(
                          "text-slate-600 font-medium max-w-20 ",
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
              {Object.entries(homeState.data?.data).map(([key, item]: [string, any]) => {
                return (
                  <TableRow key={key}>
                    <TableCell className="flex items-center gap-x-2 max-w-sm w-full">
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
                        <HoverCard key={`${data.hour}-id-${Math.random()}`} openDelay={0}>
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
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="w-full flex justify-between items-center">
        <Button variant="outline" onClick={handleLoadMore} disabled={!homeState.data.has_more}>
          Load More
        </Button>
        <Typography variant="p" className="px-5 font-semibold">
          {`${Object.keys(homeState.data.data).length | 0} of ${homeState.data.total_count | 0}`}
        </Typography>
      </div>
    </>
  );
};

export default Home;
