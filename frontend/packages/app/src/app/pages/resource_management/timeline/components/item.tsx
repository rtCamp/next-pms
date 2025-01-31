/**
 * External dependencies.
 */
import { useState } from "react";
import { ItemContext } from "react-calendar-timeline";
import { getDayDiff, prettyDate } from "@next-pms/design-system";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  Typography,
} from "@next-pms/design-system/components";
import { X, Move, Copy, CalendarX } from "lucide-react";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { DeleteIcon } from "../../components/resourceAllocationList";
import { getInitials } from "../../utils/helper";

import { ResourceAllocationItemProps, ResourceAllocationTimeLineProps } from "../types";

interface ResourceTimeLineItemProps {
  item: ResourceAllocationTimeLineProps;
  itemContext: ItemContext;
  getItemProps: (itemProps: ResourceAllocationItemProps) => ResourceAllocationItemProps;
  getResizeProps: () => { left: object; right: object };
}

const ResourceTimeLineItem = ({ item, itemContext, getItemProps, getResizeProps }: ResourceTimeLineItemProps) => {
  if (item.type == "leave") {
    return (
      <LeaveItemRender
        item={item}
        itemContext={itemContext}
        getItemProps={getItemProps}
        getResizeProps={getResizeProps}
      />
    );
  }
  return (
    <AllocationItemRender
      item={item}
      itemContext={itemContext}
      getItemProps={getItemProps}
      getResizeProps={getResizeProps}
    />
  );
};

const LeaveItemRender = ({ item: leave, itemContext, getItemProps, getResizeProps }: ResourceTimeLineItemProps) => {
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
        className={cn("rct-item-content")}
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
          className={cn("flex justify-start gap-[2px] h-full w-full", !title && "justify-center")}
          style={{
            alignItems: "center",
            maxHeight: itemContext.dimensions.height,
          }}
        >
          <CalendarX
            className={cn("z-[1000] text-gray-500 cusror-pointer w-4 h-4", title && "mr-1")}
            size={16}
            strokeWidth={2}
          />

          {title && (
            <Typography variant="small" className={cn("text-[12px] truncate overflow-hidden block text-gray-500")}>
              {title}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

const AllocationItemRender = ({
  item: resourceAllocation,
  itemContext,
  getItemProps,
  getResizeProps,
}: ResourceTimeLineItemProps) => {
  const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);

  const dayDiff = getDayDiff(resourceAllocation.allocation_start_date, resourceAllocation.allocation_end_date);

  const getTitle = (isNeedFullTitle = false) => {
    const title = `${
      resourceAllocation.project_name ? resourceAllocation.project_name + " " : ""
    }${startDate} - ${endDate} (${resourceAllocation.hours_allocated_per_day} hours/day)`;

    if (isNeedFullTitle) {
      if (dayDiff == 0) {
        return `${resourceAllocation.project_name ? resourceAllocation.project_name + " " : ""}${startDate} (${
          resourceAllocation.hours_allocated_per_day
        } hours/day)`;
      }
      return title;
    }

    if (dayDiff <= 2 || (resourceAllocation.isShowMonth && dayDiff <= 10)) {
      return "";
    }

    if (dayDiff <= 4) {
      return `${startDate} - ${endDate} (${resourceAllocation.hours_allocated_per_day} hours/day)`;
    }

    return title;
  };

  let itemProps = getItemProps(resourceAllocation.itemProps);

  const title = getTitle();

  itemProps = {
    ...itemProps,
    style: {
      ...itemProps.style,
      padding: "1px",
      background: resourceAllocation.is_billable ? "rgba(147, 221, 137, 0.39)" : "#d7d77b26",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
      borderWidth: 0,
      borderRightWidth: resourceAllocation.canDelete && itemContext.selected ? 3 : 0,
      overflow: dayDiff <= (resourceAllocation.isShowMonth ? 30 * 3 : 10) ? "hidden" : "visible",
    },
  };

  return (
    <div {...itemProps} title={getTitle(true)}>
      {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

      <div
        className={cn("rct-item-content")}
        style={
          title
            ? { maxHeight: itemContext.dimensions.height }
            : { maxHeight: itemContext.dimensions.height, width: itemProps.style.width }
        }
      >
        <div
          className={cn("flex justify-start gap-[2px] h-full w-full", !title && "justify-center")}
          style={{ alignItems: "center", maxHeight: itemContext.dimensions.height }}
        >
          {itemContext.selected && resourceAllocation.canDelete && (
            <DeleteIcon
              resourceAllocation={resourceAllocation}
              resourceAllocationPermission={{ delete: resourceAllocation.canDelete }}
              buttonClassName={cn("text-red-500 z-[1000] mr-1 cusror-pointer hover:text-red-600 w-7 h-4 p-0")}
              onSubmit={resourceAllocation.onDelete}
            />
          )}

          {(!itemContext.selected || !resourceAllocation.canDelete) && (
            <Avatar className="w-5 h-5 mr-1">
              {resourceAllocation.customerData.image && (
                <AvatarImage src={decodeURIComponent(resourceAllocation.customerData.image)} />
              )}
              <AvatarFallback className="bg-gray-300 text-black">
                {getInitials(resourceAllocation.customerData.name[0])}
              </AvatarFallback>
            </Avatar>
          )}

          {title && (
            <Typography
              variant="small"
              className={cn(
                "text-[12px] truncate overflow-hidden block",
                resourceAllocation.is_billable
                  ? "bg-gradient-to-r from-green-500 to-green-800 bg-clip-text text-transparent"
                  : "text-yellow-500"
              )}
            >
              {title}
            </Typography>
          )}
        </div>
      </div>
      {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
    </div>
  );
};

interface ItemAllocationActionDialogProps {
  handleMove: () => void;
  handleCopy: () => void;
  handleCancel: () => void;
}

export const ItemAllocationActionDialog = ({
  handleMove,
  handleCopy,
  handleCancel,
}: ItemAllocationActionDialogProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[425px] z-[1000]">
        <DialogHeader>
          <DialogDescription>
            <Typography className="text-xl mb-2 mt-3 font-semibold">
              Are you sure you want to move or copy this allocation?
            </Typography>
            <Typography className="text-sm">
              This action will either move or copy the given allocation. Please confirm your choice.
            </Typography>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            className="outline-none"
            onClick={() => {
              setOpen(false);
              handleMove();
            }}
          >
            <Move className="w-4 h-4" />
            Move
          </Button>
          <Button
            className="outline-none"
            onClick={() => {
              setOpen(false);
              handleCopy();
            }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            type="button"
            className="outline-none"
            variant="secondary"
            onClick={() => {
              handleCancel();
            }}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceTimeLineItem;
