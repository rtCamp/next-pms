import { useState, useEffect } from "react";
import { Matcher } from "react-day-picker";
import { format, isToday, isYesterday } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Calendar, CalendarProps } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { getDateTimeForMultipleTimeZoneSupport } from "@/lib/utils";
import { Typography } from "./typography";

interface DatePickerProps {
  date?: Date | string;
  disabled?: boolean;
  disabledDates?: Matcher | Matcher[] | undefined;
  onDateChange?: (date: Date) => void;
}

export const DatePicker = ({
  date,
  disabled,
  onDateChange,
  disabledDates,
  ...props
}: DatePickerProps & CalendarProps) => {
  const [pickerDate, setPickerDate] = useState<Date>();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (!date) setPickerDate(getDateTimeForMultipleTimeZoneSupport() as Date);

    if (date && typeof date === "string") {
      setPickerDate(getDateTimeForMultipleTimeZoneSupport(date) as Date);
    } else {
      setPickerDate(date as Date);
    }
  }, [date]);

  const onDateSelect = (date: Date) => {
    setPickerDate(date);
    onDateChange && onDateChange(date);
    setIsOpen(false);
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-full" disabled={disabled}>
            <Typography variant="p" className="truncate">{pickerDate ? formateDate(pickerDate) : "Pick a date"}</Typography>
            <CalendarIcon className="h-4 w-4 stroke-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          <Calendar mode="single" selected={pickerDate} onSelect={onDateSelect} disabled={disabledDates} {...props} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const formateDate = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};
