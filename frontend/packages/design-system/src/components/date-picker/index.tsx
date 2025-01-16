/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import { Matcher } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

/**
 * Internal dependencies
 */
import { default as Button } from "../button";
import { default as Calendar, CalendarProps } from "../calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import Typography from "../typography";
import { getUTCDateTime, getDisplayDate } from "../../utils/date";

export type DatePickerProp = CalendarProps & {
  date?: Date | string;
  disabled?: boolean;
  disabledDates?: Matcher | Matcher[];
  onDateChange?: (date: Date) => void;
};

const DatePicker = ({ date, disabled, onDateChange, disabledDates, ...props }: DatePickerProp) => {
  const [pickerDate, setPickerDate] = useState<Date>();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (!date) setPickerDate(getUTCDateTime() as Date);

    if (date && typeof date === "string") {
      setPickerDate(getUTCDateTime(date) as Date);
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
            <Typography variant="p">{pickerDate ? getDisplayDate(pickerDate) : "Pick any date"}</Typography>
            <CalendarIcon className=" stroke-slate-400" />
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
export default DatePicker;
