/**
 * External dependencies
 */
import { useState, useRef } from "react";
import { floatToTime, cn } from "@next-pms/design-system";
import { Input } from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */
import { timeStringToFloat } from "@/schema/timesheet";
import type { HourInputprops } from "./types";

/**
 * HourInput component allows users to input and update the number of hours worked by an employee.
 *
 * @param {HourInputprops} props - The properties for the HourInput component.
 * @param {NewTimesheetProps} props.data - The initial timesheet data.
 * @param {string} props.employee - The employee identifier.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 * @param {string} [props.className] - Additional class names for styling.
 * @param {function} props.callback - Callback function to handle the updated timesheet data.
 *
 * @returns {JSX.Element} The HourInput component.
 */
export const HourInput = ({ data, employee, disabled = false, className, callback }: HourInputprops): JSX.Element => {
  const [hour, setHour] = useState(String(floatToTime(data.hours)));
  const [prevHour, setPrevHour] = useState(String(floatToTime(data.hours)));
  const inputRef = useRef<HTMLInputElement>(null);
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hour = e.target.value;
    if (!hour) {
      return setHour(hour);
    }
    setHour(String(timeStringToFloat(hour)));
  };
  const updateTime = () => {
    if (timeStringToFloat(prevHour) === timeStringToFloat(hour)) return;

    if (hour.trim() == "" || Number.isNaN(hour)) return;
    const value = {
      ...data,
      hours: timeStringToFloat(hour),
      employee: employee,
    };
    callback(value);
    setPrevHour(String(floatToTime(data.hours)));
    if (inputRef.current) {
      inputRef.current.value = String(floatToTime(timeStringToFloat(hour)));
    }
  };
  return (
    <Input
      ref={inputRef}
      defaultValue={hour}
      className={cn("w-20 text-sm", className)}
      onBlur={updateTime}
      onChange={handleHourChange}
      disabled={disabled}
    />
  );
};
