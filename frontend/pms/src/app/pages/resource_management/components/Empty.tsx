import { Typography } from "@/app/components/typography";
import { TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { getTableCellClass } from "../utils/helper";

const EmptyTableBody = () => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={15} className="h-24 text-center">
          No results
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

const EmptyRow = ({ dates }: { dates: string[] }) => {
  return (
    <TableRow className="flex items-center w-full border-0">
      <TableCell className="w-[24rem] overflow-hidden pl-12">
        <Typography variant="p" className="flex gap-x-2 items-center font-normal hover:underline w-full">
          {" "}
        </Typography>
        {/* <Typography variant="small" className="text-slate-500 truncate">
        {taskData.project_name}
      </Typography> */}
      </TableCell>
      {dates.map((date: string, index: number) => {
        return (
          <TableCell className={getTableCellClass(index)} key={date}>
            -
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export { EmptyTableBody, EmptyRow };
