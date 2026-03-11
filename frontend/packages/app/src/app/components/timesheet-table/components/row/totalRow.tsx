/**
 * External dependencies
 */
import { TotalRow as BaseTotalRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import type { TotalRowProps } from "./types";

/**
 * @description This is the total component for the timesheet table.
 * It is responsible for rendering the total row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {boolean} props.showHeading - If the heading should be shown
 */
export const TotalRow = (props: TotalRowProps) => {
  return <BaseTotalRow {...props} />;
};
