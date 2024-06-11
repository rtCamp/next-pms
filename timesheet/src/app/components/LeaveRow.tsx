import { TableCell, TableRow } from "@/components/ui/table";
import { TaskCell } from "./TaskCell";
import { floatToTime } from "@/app/lib/utils";
export function LeaveRow({
  dates,
  leaves,
}: {
  dates: Array<string>;
  leaves: any;
}) {
  let totalHours = 0;
  return (
    <TableRow key={1} className="flex  border-b-[1px] bg-[#F4F4F5]">
      <TableCell className=" flex w-full max-w-md text-justify font-medium hover:cursor-pointer !px-2 py-4">
        TIME OFF
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
