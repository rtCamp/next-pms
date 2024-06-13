import { TableCell, TableRow } from "@/components/ui/table";
import { floatToTime } from "@/app/lib/utils";
import { Typography } from "@/app/components/Typography";
import { CirclePlus } from "@/app/components/Icon";
import { useEffect, useState } from "react";
import { PencilLine } from "lucide-react";

export function Cell({ item, row }: { item: any; row: any }) {
  const [data, setData] = useState<any>([]);
  const [isHovered, setIsHovered] = useState(false);
  const dateMap = item?.dates;
  const key = item.key;
  useEffect(() => {
    let dateArray = [];
    let isNew = false;
    for (let i = 0; i < dateMap.length; i++) {
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
      if (timesheet && leaveData) {
        hour = timesheet.total_hours + (leaveData?.half_day ? 4 : 8);
      }
      if (hour == 8) {
        bgClass = "bg-success/25";
      } else if (hour > 8) {
        bgClass = "bg-warning/25";
      } else if (!timesheet && !leaveData) {
        bgClass = "bg-tansparent";
      }

      if (!isNew && (hour == 0 || (!timesheet && !leaveData))) {
        dateArray.push({ date, hour, bgClass, isHoliday, isNew: true, key });
        isNew = true;
      } else {
        dateArray.push({ date, hour, bgClass, isHoliday, isNew: false, key });
      }
    }
    setData(dateArray);
  }, []);

  return (
    <TableCell key={item.key} className="px-0 py-0 col-span-4">
      <TableRow
        className={`flex h-full !border-b-0 w-full ${
          item.key != "This Week" ? "bg-primary" : ""
        }`}
        // onMouseEnter={() => setIsHovered(true)}
        // onMouseLeave={() => setIsHovered(false)}
      >
        {data.map((item: any) => {
          let css = "bg-background";
          if (item.isNew) {
            if (item.key == "This Week") {
              css = "bg-primary";
            } else {
              css = "bg-background";
            }
          } else {
            css = item.bgClass;
          }
          return (
            <TableCell
              className={`w-full max-w-14 flex items-center p-0 hover:cursor-pointer px-2 py-3 flex items-center justify-center ${css}`}
            >
              {item.isNew ? (
                <CirclePlus stroke="#AB3A6C" />
              ) : (
                <Typography
                  variant="p"
                  className={`!text-[15px]  !font-semibold `}
                >
                  {!item.isHoliday && item.hour != 0
                    ? floatToTime(item.hour)
                    : ""}
                </Typography>
              )}
              {/* {isHovered && !item.isNew && <PencilLine />} */}
            </TableCell>
          );
        })}
      </TableRow>
    </TableCell>
  );
}
