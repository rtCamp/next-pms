import { TableCell, TableRow } from "@/components/ui/table";
import { TaskCell } from "./TaskCell";
import { floatToTime } from "@/app/lib/utils";
import { Typography } from "./Typography";
export function LeaveRow({
  dates,
  leaves,
}: {
  dates: Array<string>;
  leaves: any;
}) {
  let totalHours = 0;
  return (
    <TableRow key={1} className="flex  border-b-[1px] ">
      <TableCell className=" flex w-full max-w-sm text-justify  hover:cursor-pointer !px-2 py-4">
        <Typography variant="p" className="sm:text-sm !font-medium ">Time Off</Typography>
      </TableCell>
      {dates.map((date: string) => {
        let hour = 0;
        const leaveData = leaves.find((data: any) => {
          return date >= data.from_date && date <= data.to_date;
        });
        if (leaveData) {
          totalHours += leaveData?.half_day ? 4 : 8;
          hour = leaveData?.half_day ? 4 : 8;
        }

        return (
          <TaskCell
            key={date}
            description={leaveData?.description}
            hours={hour}
            date={date}
            isCellDisabled={true}
            onCellClick={() => {}}
          />
        );
      })}
      <TableCell
        key="TotlaHour"
        className="flex w-full justify-center flex-col font-bold max-w-24 px-0 text-center hover:cursor-pointer  "
      >
        {floatToTime(totalHours)}
      </TableCell>
    </TableRow>
  );
}
