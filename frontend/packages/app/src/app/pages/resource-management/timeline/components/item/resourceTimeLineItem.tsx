/**
 * Internal dependencies.
 */
import { AllocationItemRender } from "./allocationItemRender";
import { LeaveItemRender } from "./leaveItemRender";
import type { ResourceTimeLineItemProps } from "../../types";

const ResourceTimeLineItem = ({
  item,
  itemContext,
  getItemProps,
  getResizeProps,
}: ResourceTimeLineItemProps) => {
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

export { ResourceTimeLineItem };
