/**
 * External dependencies
 */
import { useMemo } from "react";
import { HeaderRow as BaseHeaderRow } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";

/**
 * Internal dependencies
 */
import type { HeaderRowProps } from "./types";

/**
 * @description This is the header component for the timesheet table.
 * It is responsible for rendering the header of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {boolean} props.showHeading - If the heading should be shown
 */
export const HeaderRow = ({ dates, showHeading, ...rest }: HeaderRowProps) => {
  const days = useMemo(() => {
    return dates?.map((date: string) => prettyDate(date).day);
  }, [dates]);

  if (!showHeading) return <></>;

  return <BaseHeaderRow {...rest} days={days} />;
};
