import { Typography } from "@/app/components/typography";
import { TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { getTableCellClass } from "../utils/helper";
import { cn, prettyDate } from "@/lib/utils";
import { DateProps } from "@/store/resource_management/team";

interface ResourceTableHeaderProps {
  dates: DateProps[];
  title: string;
}

const ResourceTableHeader = ({ dates, title }: ResourceTableHeaderProps) => {
  return (
    <TableHeader className="border-t-0 sticky top-0 z-30">
      <TableRow className="flex items-center">
        <TableHead className="w-[15rem] flex items-center">{title}</TableHead>
        <div className="flex flex-col w-[60rem]">
          <div className="flex items-center">
            <Typography className="w-full text-center truncate cursor-pointer text-sm border-r border-gray-300">
              {dates.length > 0 && dates[0].key}
            </Typography>
            <Typography className="w-full text-center truncate cursor-pointer text-sm border-r border-gray-300">
              {dates.length > 0 && dates[1].key}
            </Typography>
            <Typography className="w-full text-center truncate cursor-pointer text-sm">
              {dates.length > 0 && dates[2].key}
            </Typography>
          </div>
          <div className="flex items-center">
            {dates.map((item: DateProps, weekIndex: number) => {
              return item?.dates?.map((date, index) => {
                const { date: dateStr, day } = prettyDate(date);
                return (
                  <TableHead
                    key={date}
                    className={cn(
                      getTableCellClass(index, weekIndex, true),
                      "text-xs flex flex-col px-2 py-2 max-w-20 w-full justify-center items-center"
                    )}
                  >
                    <Typography variant="p" className="text-slate-600 text-[11px]">
                      {day}
                    </Typography>
                    <Typography variant="small" className="text-slate-500 text-[11px] max-lg:text-[0.65rem]">
                      {dateStr}
                    </Typography>
                  </TableHead>
                );
              });
            })}
          </div>
        </div>
      </TableRow>
    </TableHeader>
  );
};

export default ResourceTableHeader;
