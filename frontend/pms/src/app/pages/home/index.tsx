import { useToast } from "@/app/components/ui/use-toast";
import {
  cn,
  parseFrappeErrorMsg,
  prettyDate,
  floatToTime,
  getFormatedDate,
  calculateExtendedWorkingHour,
  preProcessLink,
} from "@/lib/utils";
import { TEAM, EMPLOYEE } from "@/lib/constant";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Header, Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import {
  setData,
  setWeekDate,
  setEmployeeName,
  DateProps,
  setStart,
  updateData,
  resetState,
  setFilters,
  setStatus,
} from "@/store/home";
import { Spinner } from "@/app/components/spinner";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { addDays, isToday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ChevronRight, ChevronLeft, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";
import { dataItem } from "@/types/team";
import { useQueryParamsState } from "@/lib/queryParam";
import { useNavigate } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { DeBounceInput } from "@/app/components/deBounceInput";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";

const Home = () => {
  const { toast } = useToast();
  const homeState = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch();
  const [employeeNameParam, setEmployeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [employeeStatusParam, setEmployeeStatusParam] = useQueryParamsState<Array<string>>("status", ["Active"]);
  const navigate = useNavigate();
  const empStatus = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
    { label: "Suspended", value: "Suspended" },
    { label: "Left", value: "Left" },
  ];

  useEffect(() => {
    const payload = {
      employeeName: employeeNameParam,
      status: employeeStatusParam,
    };
    dispatch(setFilters(payload));
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, error, isLoading } = useFrappeGetCall("next_pms.timesheet.api.team.get_compact_view_data", {
    date: homeState.weekDate,
    employee_name: homeState.employeeName,
    page_length: homeState.pageLength,
    start: homeState.start,
    status: homeState.status,
  });
  useEffect(() => {
    if (data) {
      if (homeState.action=="SET") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error,homeState.action]);

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
      setEmployeeNameParam(e.target.value);
    },
    [dispatch, setEmployeeNameParam]
  );

  const handleStatusChange = useCallback(
    (value: string | string[]) => {
      dispatch(setStatus(value as string[]));
      setEmployeeStatusParam(value as string[]);
    },
    [dispatch, setEmployeeStatusParam]
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
    dispatch(setStart(homeState.start + homeState.pageLength));
  }, [dispatch, homeState.data.has_more, homeState.start]);

  return (
    <>
      <Header>
        <section id="filter-section" className="flex max-md:flex-col gap-x-3  w-full md:items-center ">
          <div className=" flex gap-x-2 max-w-sm w-full mx-2 items-center max-md:overflow-x-auto">
            <DeBounceInput
              placeholder="Employee name"
              value={employeeNameParam}
              deBounceValue={300}
              className="min-w-40 max-w-40"
              callback={handleEmployeeChange}
            />
            <ComboxBox
              value={employeeStatusParam}
              label="Employee Status"
              data={empStatus}
              shouldFilter
              isMulti
              onSelect={handleStatusChange}
              leftIcon={<Filter className={cn("h-4 w-4", homeState.status.length != 0 && "fill-primary")} />}
              rightIcon={homeState.status.length > 0 && <Badge className="px-1.5">{homeState.status.length}</Badge>}
              className="text-primary w-full border-dashed gap-x-1 font-normal w-fit"
            />
          </div>
          <div className="w-full flex items-center  max-md:mt-2 max-md:p-1">
            <div className="grow flex items-center w-full overflow-x-auto">
              <Button title="prev" variant="outline" className="p-1 h-fit" onClick={handleprevWeek}>
                <ChevronLeft className="w-4 h-4 max-sm:w-3 max-sm:h-3" />
              </Button>
              <Typography
                className="w-full text-center max-md:text-left mx-3  max-sm:text-sm  max-md:text-[2vw] truncate cursor-pointer"
                variant="h6"
                title={homeState.data.dates.length > 0 ? homeState.data.dates[0].key : ""}
              >
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                {homeState.data.dates.length > 0 && homeState.data.dates[0].key}
              </Typography>
            </div>
            <div className="grow flex items-center w-full">
              <Typography
                className="w-full text-center max-md:text-right mx-3  max-sm:text-sm max-md:text-[2vw] truncate cursor-pointer"
                variant="h6"
                title={homeState.data.dates.length > 0 ? homeState.data.dates[1].key : ""}
              >
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
      </Header>
      {isLoading && Object.keys(homeState.data.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <Table className="[&_tr]:pr-3 relative">
          <TableHeader className="border-t-0 sticky top-0 w-full z-10">
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
            {Object.entries(homeState.data?.data).length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Object.entries(homeState.data?.data).map(([key, item]: [string, any]) => {
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
              })
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
