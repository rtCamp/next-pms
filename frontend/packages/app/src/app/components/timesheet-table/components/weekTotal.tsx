/**
 * External dependencies
 */
import { TableCell, Typography } from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system/utils";
/**
 * Internal dependencies
 */
import { calculateExtendedWorkingHour, mergeClassNames, calculateWeeklyHour } from "@/lib/utils";
import type { weekTotalProps } from "./types";

/**
 * @description This component shows the total hours for the week,
 * to the far right in the timesheet grid. It calculates the expected
 * working hours for the week and compares it with the total hours
 * and show indicator for hours based on the expected hours.
 *
 * @param {number} props.total - The total hours for the week
 * @param {number} props.expected_hour - The expected hours for the week
 * @param {WorkingFrequency} props.frequency - The working frequency
 * @param {string} props.className - Class name for the component
 */
export const WeekTotal = ({ total, expected_hour, frequency, className }: weekTotalProps) => {
  const isExtended = calculateExtendedWorkingHour(total, calculateWeeklyHour(expected_hour, frequency), frequency);
  return (
    <TableCell className={mergeClassNames(className)}>
      <Typography
        variant="p"
        className={mergeClassNames(
          "text-right font-medium",
          isExtended == 0 && "text-destructive",
          isExtended && "text-success",
          isExtended == 2 && "text-warning"
        )}
      >
        {floatToTime(total)}
      </Typography>
    </TableCell>
  );
};
