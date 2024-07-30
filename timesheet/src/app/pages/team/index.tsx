import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, CircleCheck, Hourglass, CircleX } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
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
  setHasMore,
  resetData,
  setDateRange,
  setApprovalDialog,
  setEmployee,
} from "@/store/team";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg, prettyDate, floatToTime, getFormatedDate, cn } from "@/lib/utils";
import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Employee } from "./employee";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Approval } from "./approval";
import { TEAM, EMPLOYEE } from "@/lib/constant";

type ProjectProps = {
  project_name: string;
  name: string;
};
type ItemDataProps = {
  date: string;
  hour: number;
};
type ItemProps = {
  employee_name: string;
  name: string;
  image: string;
  data: Array<ItemDataProps>;
  status: string;
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

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
  });

  const { data, error } = useFrappeGetCall("timesheet_enhancer.api.team.get_compact_view_data", {
    date: teamState.weekDate,
    max_week: 1,
    page_length: 20,
    project: teamState.project,
    start: teamState.start,
  });

  const approvals = [
    { label: "Not Submitted", value: "Not Submitted" },
    { label: "Approval Pending", value: "Approval Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];

  useEffect(() => {
    if (data) {
      if (Object.keys(teamState.data.data).length > 0) {
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
  }, [data, error]);

  const handleprevWeek = () => {
    const date = getFormatedDate(addDays(teamState.weekDate, -6));
    dispatch(setStart(0));
    dispatch(resetData());
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
  };
  const handlenextWeek = () => {
    const date = getFormatedDate(addDays(teamState.weekDate, 6));
    dispatch(setStart(0));
    dispatch(resetData());
    dispatch(setWeekDate(date));
    dispatch(setFetchAgain(true));
  };
  const handleProjectChange = (value: string | string[]) => {
    dispatch(setProject(value as string[]));
    dispatch(setStart(0));
    dispatch(resetData());
    dispatch(setFetchAgain(true));
  };
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
    dispatch(setDateRange(data));
    dispatch(setEmployee(employee));
    dispatch(setApprovalDialog(true));
  };
  return (
    <>
      <div className="flex gap-x-2 items-center justify-between mb-3">
        <Approval />
        <div id="filters" className="flex gap-x-2">
          <ComboxBox
            label="Approval"
            data={approvals}
            isMulti
            leftIcon={<Filter className="h-4 w-4" />}
            className="text-primary border-dashed gap-x-2 font-normal"
            disabled
          />
          <ComboxBox
            label="Projects"
            isMulti
            onSelect={handleProjectChange}
            leftIcon={<Filter className="h-4 w-4" />}
            data={projects?.message.map((item: ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            }))}
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
                    <TableHead className="flex flex-col max-w-20 w-full">
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
              <TableHead className="w-full max-w-24 flex items-center">Total</TableHead>
              <TableHead className="w-full max-w-20 flex items-center">
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
                <TableRow className="flex items-center w-full">
                  <Accordion type="multiple" key={key} className="w-full">
                    <AccordionItem value={key} className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-0">
                        <span className="w-full flex">
                          <TableCell className="w-full max-w-md ">
                            <span
                              className="flex gap-x-2 items-center font-normal hover:underline w-fit"
                              onClick={() => {
                                navigate(`${TEAM}${EMPLOYEE}/${item.name}`);
                              }}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={decodeURIComponent(item.image)} />
                                <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                              </Avatar>
                              {item.employee_name}
                            </span>
                          </TableCell>
                          {item.data.map((data: ItemDataProps) => {
                            total += data.hour;
                            return (
                              <TableCell className={cn("max-w-20 w-full text-left")}>
                                <Typography className={cn(data.hour > 8 && "text-warning")} variant="p">
                                  {data.hour ? floatToTime(data.hour) : "-"}
                                </Typography>
                              </TableCell>
                            );
                          })}
                          <TableCell className="w-full max-w-24 text-left">{floatToTime(total)}</TableCell>

                          <TableCell
                            className="w-full max-w-16 flex items-center"
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

      <Button variant="outline" onClick={handleLoadMore} disabled={!teamState.hasMore}>
        Load More
      </Button>
    </>
  );
};

const Status = ({ status }: { status: string }) => {
  if (status === "Pending") {
    return <Hourglass className="w-4 h-4 stroke-warning " />;
  }
  if (status === "Approved") {
    return <CircleX className="w-4 h-4 stroke-success" />;
  }
  return <CircleCheck className="w-4 h-4 " />;
};
export default Team;
