import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Typography } from "./typography";

interface DatePickerProps {
  date?: Date | string;
  onDateChange?: (date: Date) => void;
}

export const DatePicker = ({ date, onDateChange }: DatePickerProps) => {
  const [pickerDate, setPickerDate] = useState<Date>();

  useEffect(() => {
    if (!date) setPickerDate(new Date());

    if (date && typeof date === "string") {
      setPickerDate(new Date(date));
    } else {
      setPickerDate(date as Date);
    }
  }, [date]);

  const onDateSelect = (date: Date) => {
    setPickerDate(date);
    onDateChange && onDateChange(date);
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-full">
            <Typography variant="p">{pickerDate ? formateDate(pickerDate) : "Pick a date"}</Typography>
            <CalendarIcon className="h-4 w-4 stroke-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          <Calendar mode="single" selected={pickerDate} onSelect={onDateSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const formateDate = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "do MMMM");
};
