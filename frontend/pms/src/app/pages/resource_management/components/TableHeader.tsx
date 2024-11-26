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
      <TableRow className="flex items-center w-[75rem]">
        <TableHead className="w-[24rem] flex items-center">{title}</TableHead>
        <div className="flex flex-col w-[50rem]">
          <div className="flex items-center">
            <Typography className="w-full text-center truncate cursor-pointer text-base border-r border-gray-300 my-1">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {dates.length > 0 && dates[0].key}
            </Typography>
            <Typography className="w-full text-center truncate cursor-pointer text-base my-1">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {dates.length > 0 && dates[1].key}
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
                      "flex flex-col max-w-20 w-full items-center justify-center"
                    )}
                  >
                    <Typography variant="p" className="text-slate-600">
                      {day}
                    </Typography>
                    <Typography variant="small" className="text-slate-500 max-lg:text-[0.65rem]">
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
