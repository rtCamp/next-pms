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
  calculateExpectedWorkingHour
} from "@/lib/utils";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setData,
  setFetchAgain,
  setWeekDate,
  setEmployeeName,
  DateProps,
  setStart,
  setHasMore,
  updateData,
  resetData
} from "@/store/home";
// import { Spinner } from "@/app/components/spinner";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { addDays, isToday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Input } from "@/app/components/ui/input";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Typography } from "@/app/components/typography";

const Home = () => {
  const { toast } = useToast();
  const homeState = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch();

  const { data, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.team.get_compact_view_data", {
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
      dispatch(setHasMore(data.message.has_more));
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

  const onInputChange = deBounce((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setEmployeeName(e.target.value));
    dispatch(setStart(0));
    dispatch(resetData());
    dispatch(setFetchAgain(true));
  }, 1000);

  const handleprevWeek = () => {
    const date = getFormatedDate(addDays(homeState.weekDate, -14));
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
  };
  const handlenextWeek = () => {
    const date = getFormatedDate(addDays(homeState.weekDate, 14));
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
  };
  const handleLoadMore = () => {
    if (!homeState.hasMore) return;
    dispatch(setStart(homeState.start + 20));
    dispatch(setFetchAgain(true));
  };
  //   if (isLoading) return <Spinner isFull />;

  return (
    <>
      <section id="filter-section" className="flex gap-x-3 mb-3">
        <div className="pr-4 max-w-sm w-full">
          <Input
            placeholder="Employee name"
            className="placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800 max-w-sm"
            onChange={onInputChange}
          />
        </div>
        <div className="w-full flex">
          <div className="grow flex items-center w-full">
            <Button variant="outline" className="p-1 h-fit" onClick={handleprevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Typography className="w-full text-center" variant="h6">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {homeState.data.dates.length > 0 && homeState.data.dates[0].key}
            </Typography>
          </div>
          <div className="grow flex items-center w-full">
            <Typography className="w-full text-center" variant="h6">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {homeState.data.dates.length > 0 && homeState.data.dates[1].key}
            </Typography>
            <Button variant="outline" className="p-1 h-fit" onClick={handlenextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
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
                        "text-slate-600 font-medium max-w-20",
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
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={decodeURIComponent(item.image)} alt={item.employee_name} />
                      <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                    </Avatar>
                    {item.employee_name}
                  </TableCell>
                  {item.data.map((data: any, index: number) => {
                    const isMoreThanExpected = calculateExtendedWorkingHour(
                      data.hour,
                      item.working_hour,
                      item.working_frequency
                    );
                    const isExpected = calculateExpectedWorkingHour(
                      data.hour,
                      item.working_hour,
                      item.working_frequency
                    );
                    return (
                      <TableCell
                        className={cn(
                          "text-xs",
                          isExpected && "bg-success/20",
                          isMoreThanExpected && "bg-warning/20",
                          isToday(data.date) && "bg-slate-50",
                          data.hour == 0 && "text-center"
                        )}
                        key={`${key}-${index}`}
                      >
                        {data.hour > 0 ? floatToTime(data.hour) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" onClick={handleLoadMore} disabled={!homeState.hasMore}>
        Load More
      </Button>
    </>
  );
};

export default Home;
