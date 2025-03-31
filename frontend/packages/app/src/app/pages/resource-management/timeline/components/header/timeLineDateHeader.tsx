/**
 * External dependencies.
 */
import { getTodayDate, prettyDate } from "@next-pms/design-system";
import { TableHead, Typography } from "@next-pms/design-system/components";
import { TableContext } from "@next-pms/resource-management/store";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { getDayKeyOfMoment } from "../../../utils/dates";
import type { ResourceAllocationItemProps, TimeLineHeaderFunctionProps } from "../../types";

const TimeLineDateHeader = ({ getIntervalProps, intervalContext }: TimeLineHeaderFunctionProps) => {
  const { interval } = intervalContext;
  const { startTime } = interval;
  const { date: dateStr, day } = prettyDate(getDayKeyOfMoment(startTime));
  const { date: toDayStr } = prettyDate(getTodayDate());

  const { tableProperties } = useContextSelector(TableContext, (value) => value.state);
  const { getCellWidthString } = useContextSelector(TableContext, (value) => value.actions);

  let headerProps: ResourceAllocationItemProps = getIntervalProps();

  headerProps = {
    ...headerProps,
    style: {
      ...headerProps.style,
      width: getCellWidthString(tableProperties.cellWidth),
    },
  };

  return (
    <TableHead
      {...headerProps}
      className={mergeClassNames(
        "text-xs flex flex-col justify-end items-center border-0 p-0 h-full pb-2",
        day == "Sun" && "border-l border-gray-300",
        dateStr == toDayStr && "font-semibold"
      )}
    >
      <div className={mergeClassNames("text-xs flex flex-col justify-end items-center pr-2")}>
        <Typography
          variant="p"
          className={mergeClassNames(
            "text-slate-600 dark:text-primary/80 text-[11px] ",
            dateStr == toDayStr && "font-semibold dark:text-primary"
          )}
        >
          {day}
        </Typography>
        <Typography
          variant="small"
          className={mergeClassNames(
            "text-slate-500 dark:text-primary/60 text-center text-[11px] max-lg:text-[0.65rem]",
            dateStr == toDayStr && "font-semibold dark:text-primary"
          )}
        >
          {dateStr}
        </Typography>
      </div>
    </TableHead>
  );
};

export { TimeLineDateHeader };
