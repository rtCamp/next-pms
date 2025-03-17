/**
 * External dependencies.
 */
import { getDayDiff, prettyDate } from "@next-pms/design-system";
import { Typography } from "@next-pms/design-system/components";
import { CalendarX } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { ResourceTimeLineItemProps } from "../../types";

const LeaveItemRender = ({ item: leave, itemContext, getItemProps }: ResourceTimeLineItemProps) => {
  const dayDiff = getDayDiff(leave.from_date as string, leave.to_date as string);

  const { date: startDate } = prettyDate(leave.from_date as string);
  const { date: endDate } = prettyDate(leave.to_date as string);

  let itemProps = getItemProps(leave.itemProps);

  const getTitle = (isNeedFullTitle = false) => {
    const title = `${startDate} - ${endDate} (${leave.total_leave_days} days)`;

    if (isNeedFullTitle) {
      return title;
    }

    if (dayDiff <= 2 || (leave.isShowMonth && dayDiff <= 20)) {
      return "";
    }

    if (dayDiff <= 3 || (leave.isShowMonth && dayDiff <= 50)) {
      return `${startDate} - ${endDate}`;
    }

    return title;
  };

  const title = getTitle();

  itemProps = {
    ...itemProps,
    style: {
      ...itemProps.style,
      padding: !title ? "0" : "1px 6px",
      background: "rgba(211, 211, 211, 0.58)",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
      borderWidth: 0,
      borderRightWidth: 0,
      overflow: dayDiff <= (leave.isShowMonth ? 30 * 3 : 10) ? "hidden" : "visible",
    },
  };

  return (
    <div style={itemProps.style} title={getTitle(true)}>
      <div
        className={mergeClassNames("rct-item-content")}
        style={
          title
            ? { maxHeight: itemContext.dimensions.height }
            : {
                maxHeight: itemContext.dimensions.height,
                height: itemContext.dimensions.height,
                width: itemProps.style.width,
              }
        }
      >
        <div
          className={mergeClassNames("flex justify-start gap-[2px] h-full w-full", !title && "justify-center")}
          style={{
            alignItems: "center",
            maxHeight: itemContext.dimensions.height,
          }}
        >
          <CalendarX
            className={mergeClassNames("z-[1000] text-gray-500 cusror-pointer w-4 h-4", title && "mr-1")}
            size={16}
            strokeWidth={2}
          />

          {title && (
            <Typography
              variant="small"
              className={mergeClassNames("text-[12px] truncate overflow-hidden block text-gray-500")}
            >
              {title}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export { LeaveItemRender };
