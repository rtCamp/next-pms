import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Typography } from "./typography";

interface DatePickerProps {
  date?: Date | string;
}

export const DatePicker = ({ date }: DatePickerProps) => {
  const [pickerDate, setPickerDate] = useState<Date>();

  useEffect(() => {
    if (!date) setPickerDate(new Date());

    if (date && typeof date === "string") {
      setPickerDate(new Date(date));
    } else {
      setPickerDate(date as Date);
    }
  }, [date]);
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-full">
            <Typography variant="p">{pickerDate ? format(pickerDate, "do MMMM") : "Pick a date"}</Typography>
            <CalendarIcon className="h-4 w-4 stroke-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar />
        </PopoverContent>
      </Popover>
    </div>
  );
};
