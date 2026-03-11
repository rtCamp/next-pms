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
 */
export const TotalRow = (props: TotalRowProps) => {
  return <BaseTotalRow {...props} />;
};
