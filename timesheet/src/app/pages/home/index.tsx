/* eslint-disable @typescript-eslint/no-explicit-any */
import { useToast } from "@/app/components/ui/use-toast";
import { cn, parseFrappeErrorMsg, prettyDate, floatToTime, deBounce } from "@/lib/utils";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setData, setFetchAgain, setEmployeeName,DateProps } from "@/store/home";
// import { Spinner } from "@/app/components/spinner";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { isToday } from "date-fns";
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
  });
  useEffect(() => {
    if (homeState.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      dispatch(setData(data.message));
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
    dispatch(setFetchAgain(true));
  }, 1000);

  //   if (isLoading) return <Spinner isFull />;

  return (
    <>
      <section id="filter-section" className="flex gap-x-2 mb-3">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Employee name"
            className="placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800"
            onChange={onInputChange}
          />
        </div>
        <div className="w-full flex">
          <div className="grow flex items-center ">
            <Button variant="outline">
              <ChevronLeft />
            </Button>
            <Typography variant="h6">{homeState.data.dates.length > 0 && homeState.data.dates[0].key}</Typography>
          </div>
          <div className="grow flex items-center">
            <Typography variant="h6">{homeState.data.dates.length > 0 && homeState.data.dates[1].key}</Typography>
            <Button variant="outline">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </section>
      <div>
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
                    return (
                      <TableCell
                        className={cn("text-xs", data.hour > 8 && "text-warning", isToday(data.date) && "bg-slate-50")}
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
    </>
  );
};

export default Home;
