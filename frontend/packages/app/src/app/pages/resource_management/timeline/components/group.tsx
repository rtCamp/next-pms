/**
 * External dependencies.
 */
import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTodayDate } from "@next-pms/design-system";
import { Avatar, AvatarFallback, AvatarImage } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { RootState } from "@/store";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import { TableInformationCellContent } from "../../components/tableCell";
import { TimeLineContext } from "../../store/timeLineContext";
import { getIsBillableValue } from "../../utils/helper";
import { ResourceAllocationEmployeeProps } from "../types";

interface ResourceTimeLineGroupProps {
  group: ResourceAllocationEmployeeProps;
}

const ResourceTimeLineGroup = ({ group }: ResourceTimeLineGroupProps) => {
  const { getLastTimeLineItem, verticalLoderRef, filters } = useContext(TimeLineContext);
  const lastEmployee = getLastTimeLineItem() == group.name;
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const setResourceAllocationData = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    dispatch(
      setResourceFormData({
        isShowDialog: true,
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
        isNeedToEdit: false,
        name: "",
      })
    );
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
      cellRef={lastEmployee ? verticalLoderRef : null}
      onClick={setResourceAllocationData}
    />
  );
};

export default ResourceTimeLineGroup;
