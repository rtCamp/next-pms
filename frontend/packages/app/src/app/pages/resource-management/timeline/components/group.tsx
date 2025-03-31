/**
 * External dependencies.
 */
import { RefObject } from "react";
import { getTodayDate } from "@next-pms/design-system";
import { Avatar, AvatarFallback, AvatarImage } from "@next-pms/design-system/components";
import { TableInformationCellContent } from "@next-pms/resource-management/components";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { ResourceFormContext } from "../../store/resourceFormContext";
import { TimeLineContext } from "../../store/timeLineContext";
import { getIsBillableValue } from "../../utils/helper";
import type { ResourceTimeLineGroupProps } from "../types";

const ResourceTimeLineGroup = ({ group }: ResourceTimeLineGroupProps) => {
  const { filters } = useContextSelector(TimeLineContext, (value) => value.state);
  const { getLastTimeLineItem, verticalLoderRef } = useContextSelector(TimeLineContext, (value) => value.actions);
  const lastEmployee = getLastTimeLineItem() == group.name;
  const { permission: resourceAllocationPermission } = useContextSelector(ResourceFormContext, (value) => value.state);

  const { updateDialogState, updateAllocationData } = useContextSelector(ResourceFormContext, (value) => value.actions);

  const setResourceAllocationData = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    updateDialogState({ isShowDialog: true, isNeedToEdit: false });

    updateAllocationData({
      employee: group.name,
      employee_name: group.employee_name,
      project: "",
      allocation_start_date: getTodayDate(),
      allocation_end_date: getTodayDate(),
      is_billable: getIsBillableValue(filters.allocationType as string[]) != "0",
      customer: "",
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project_name: "",
      customer_name: "",
      name: "",
    });
  };

  return (
    <TableInformationCellContent
      cellClassName="overflow-hidden flex items-center font-normal bg-none"
      CellComponet={() => {
        return (
          <Avatar className="w-6 h-6 hover:none">
            {group.image && <AvatarImage src={decodeURIComponent(group.image)} />}
            <AvatarFallback>{group.employee_name && group.employee_name[0]}</AvatarFallback>
          </Avatar>
        );
      }}
      value={group.employee_name}
      cellRef={lastEmployee ? (verticalLoderRef as unknown as RefObject<HTMLTableCellElement>) : undefined}
      onClick={setResourceAllocationData}
    />
  );
};

export default ResourceTimeLineGroup;
