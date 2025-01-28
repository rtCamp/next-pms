/**
 * External dependencies.
 */
import { ItemContext } from "react-calendar-timeline";
import { getDayDiff, prettyDate } from "@next-pms/design-system";
import { Avatar, AvatarFallback, AvatarImage, Typography } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { ResourceAllocationItemProps, ResourceAllocationTimeLineProps } from "./types";
import { getFilterValue, getInitials } from "../utils/helper";

interface ResourceTimeLineItemProps {
  item: ResourceAllocationTimeLineProps;
  itemContext: ItemContext;
  getItemProps: (itemProps: ResourceAllocationItemProps) => ResourceAllocationItemProps;
  getResizeProps: () => { left: object; right: object };
}

const ResourceTimeLineItem = ({
  item: resourceAllocation,
  itemContext,
  getItemProps,
  getResizeProps,
}: ResourceTimeLineItemProps) => {
  const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);

  const getTitle = () => {
    const dayDiff = getDayDiff(resourceAllocation.allocation_start_date, resourceAllocation.allocation_end_date);

    const title = `${startDate} - ${endDate} (${resourceAllocation.hours_allocated_per_day} hours/day)`;

    if (dayDiff <= 0) {
      return getFilterValue(title, 2);
    }

    if (dayDiff <= 2) {
      return getFilterValue(title, 4);
    }

    return title;
  };

  const titleToolTip = `${resourceAllocation.customerData.name} : ${resourceAllocation.hours_allocated_per_day} hours/day (${startDate} - ${endDate})`;

  let itemProps = getItemProps(resourceAllocation.itemProps);

  itemProps = {
    ...itemProps,
    style: {
      ...itemProps.style,
      padding: "1px",
      background: resourceAllocation.is_billable ? "rgba(147, 221, 137, 0.39)" : "#d7d77b26",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
    },
  };

  return (
    <div {...itemProps}>
      {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

      <div
        className={cn("rct-item-content overflow-hidden")}
        style={{ maxHeight: `${itemContext.dimensions.height}` }}
        title={titleToolTip}
      >
        <div className="flex justify-center gap-[2px] h-full w-full" style={{ alignItems: "center" }}>
          <Avatar className="w-5 h-5">
            {resourceAllocation.customerData.image && (
              <AvatarImage src={decodeURIComponent(resourceAllocation.customerData.image)} />
            )}
            <AvatarFallback className="bg-gray-300 text-black">
              {getInitials(resourceAllocation.customerData.name[0])}
            </AvatarFallback>
          </Avatar>
          <Typography
            variant="small"
            className={cn(
              "pl-[2px] truncate overflow-hidden text-[12px]",
              resourceAllocation.is_billable
                ? "bg-gradient-to-r from-green-500 to-green-800 bg-clip-text text-transparent"
                : "text-yellow-500"
            )}
          >
            {getTitle()}
          </Typography>
        </div>
      </div>

      {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
    </div>
  );
};

export default ResourceTimeLineItem;
