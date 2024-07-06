import { TableCell, TableRow } from "@/components/ui/table";
import { floatToTime } from "@/app/lib/utils";
import { Typography } from "@/app/components/Typography";
import { CirclePlus, Pencil } from "@/app/components/Icon";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setDialogInput,
  setIsAddTimeDialogOpen,
  setIsEditTimeDialogOpen,
} from "@/app/state/employeeList";

export function Cell({ item, row }: { item: any; row: any }) {
  const [data, setData] = useState<any>([]);
  const dispatch = useDispatch();

  const dateMap = item?.dates;
  const key = item.key;

  useEffect(() => {
    let dateArray = [];
    let isNew = false;
    for (let i = 0; i < dateMap.length; i++) {
      let leave = "";
      const date = dateMap[i];
      let bgClass = "bg-destructive/25";
      const timesheet = row.timesheet.find(
        (data: any) => data.start_date == date
      );
      const leaveData = row.leaves.find((data: any) => {
        return date >= data.from_date && date <= data.to_date;
      });

      const isHoliday = row.holidays.includes(date);
      let hour = timesheet ? timesheet.total_hours : 0;

      if (leaveData) {
        leave =
          leaveData?.half_day && leaveData.half_day_date == date
            ? "half_day"
            : "full_day";
      }
      if (timesheet && leave) {
        hour = timesheet.total_hours + (leave == "half_day" ? 4 : 8);
      }
      if (leave && !timesheet) {
        hour = leave == "half_day" ? 4 : 8;
      }
      if (hour == 8) {
        bgClass = "bg-success/25";
      } else if (hour > 8) {
        bgClass = "bg-warning/25";
      } else if (!timesheet && !leaveData) {
        bgClass = "bg-tansparent";
      } else if (hour == 0) {
        bgClass = "bg-tansparent";
      }
      if (!isNew && (hour == 0 || (!timesheet && !leaveData))) {
        dateArray.push({
          date,
          hour,
          bgClass,
          isHoliday,
          isNew: true,
          key,
          leave,
        });
        isNew = true;
      } else {
        dateArray.push({
          date,
          hour,
          bgClass,
          isHoliday,
          isNew: false,
          key,
          leave,
        });
      }
    }
    setData(dateArray);
  }, [row, item]);

  const onCellClick = (employee: string, date: string, hour: number) => {
    const data = {
      employee,
      task: "",
      hours: "",
      description: "",
      date: date,
      is_update: hour == 0 ? false : true,
    };
    dispatch(setDialogInput(data));
    if (!data.is_update) {
      dispatch(setIsAddTimeDialogOpen(true));
    } else {
      dispatch(setIsEditTimeDialogOpen(true));
    }
  };
  return (
    <TableCell key={item.key} className={`px-0 py-0  col-span-4`}>
      <TableRow className={`flex  !border-b-0 `}>
        {data.map((item: any) => {
          return (
            <InnerCell
              key={item.date}
              item={item}
              css={item.bgClass}
              cellClick={() => onCellClick(row.name, item.date, item.hour)}
            />
          );
        })}
      </TableRow>
    </TableCell>
  );
}

function InnerCell({
  item,
  css,
  cellClick,
}: {
  item: any;
  css: string;
  cellClick: any;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <TableCell
      className={`w-[57px] h-[49px] flex items-center  !no-underline ${
        !item.isNew ? "hover:py-1 hover:items-start hover:flex-col" : ""
      }  hover:cursor-pointer px-2 py-3 flex items-center justify-center ${css} ${
        isHovered || item.hour == 0 ? "hover:items-center" : ""
      } border-r ${
        item.leave && item.leave == "full_day"
          ? "hover:cursor-not-allowed "
          : ""
      }`}
      onMouseEnter={() =>
        (!item.leave || item.leave == "half_day") && setIsHovered(true)
      }
      onMouseLeave={() => setIsHovered(false)}
      onClick={(!item.leave || item.leave == "half_day") && cellClick}
    >
      {isHovered && (item.isNew || item.hour == 0) ? (
        <Typography variant="small" className="!text-[13px]">
          <CirclePlus className="stroke-black" width={17} height={17} />
        </Typography>
      ) : (
        <>
          <Typography variant="small" className={`!text-[13px]`}>
            {(!item.isHoliday && item.hour != 0) ||
            (item.isHoliday && item.hour != 0)
              ? floatToTime(item.hour)
              : ""}
          </Typography>
          {isHovered && !item.isNew && item.hour != 0 && (
            <Pencil className="self-center stroke-primary" />
          )}
        </>
      )}
    </TableCell>
  );
}
