/**
 * External dependencies.
 */
import { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage, Typography } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { mergeClassNames } from "@next-pms/design-system/utils";
import { getFilterValue, getFormatedStringValue } from "@next-pms/resource-management/utils";
import { Clipboard, Pencil } from "lucide-react";

/**
 * Internal dependencies.
 */
import type {
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
  ResourceCustomerProps,
} from "@/types/resource_management";
import { DeleteIcon } from "./deleteIcon";
import { ResourceFormContext } from "../../store/resourceFormContext";
import type { AllocationDataProps } from "../../store/types";
import { getInitials } from "../../utils/helper";

/**
 * This component is used to render single allocation information. also include function to create, update and destroy allocation information.
 *
 * @param props.resourceAllocation The resource allocation object.
 * @param props.customer The customer object which holds the customer data.
 * @param props.viewType The view type of resource page, team or project.
 * @param props.isLastItem The flag to check if the item is last or not.
 * @returns React.FC
 */
export const ResourceAllocationCard = ({
  resourceAllocation,
  customer,
  viewType,
  isLastItem,
  onSubmit,
}: {
  resourceAllocation: ResourceAllocationProps;
  customer: ResourceCustomerObjectProps;
  viewType?: string;
  isLastItem: boolean;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];

  const {
    permission: resourceAllocationPermission,
    updateDialogState,
    updateAllocationData,
  } = useContext(ResourceFormContext);

  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);

  const handleResourceAllocationEdit = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }
    updateDialogState({ isShowDialog: true, isNeedToEdit: true });
    updateAllocationData({
      employee: resourceAllocation.employee,
      employee_name: resourceAllocation.employee_name,
      project: resourceAllocation.project,
      allocation_start_date: resourceAllocation.allocation_start_date,
      allocation_end_date: resourceAllocation.allocation_end_date,
      is_billable: resourceAllocation.is_billable == 1,
      customer: resourceAllocation.customer,
      total_allocated_hours: getFormatedStringValue(resourceAllocation.total_allocated_hours),
      hours_allocated_per_day: getFormatedStringValue(resourceAllocation.hours_allocated_per_day),
      note: getFormatedStringValue(resourceAllocation.note),
      project_name: resourceAllocation.project_name,
      customer_name: customerData.name,
      name: resourceAllocation.name,
    });
  };

  const handleResourceAllocationCopy = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee: resourceAllocation.employee,
      employee_name: resourceAllocation.employee_name,
      project: resourceAllocation.project,
      allocation_start_date: resourceAllocation.allocation_start_date,
      allocation_end_date: resourceAllocation.allocation_end_date,
      is_billable: resourceAllocation.is_billable == 1,
      customer: resourceAllocation.customer,
      total_allocated_hours: getFormatedStringValue(resourceAllocation.total_allocated_hours),
      hours_allocated_per_day: getFormatedStringValue(resourceAllocation.hours_allocated_per_day),
      note: getFormatedStringValue(resourceAllocation.note),
      project_name: resourceAllocation.project_name,
      customer_name: customerData.name,
      name: "",
    });
  };

  return (
    <div
      className={mergeClassNames("flex flex-col items-center gap-2 relative mt-2 mb-4 w-full", isLastItem && "mb-3")}
    >
      <div className="flex gap-1 items-center w-11/12">
        <Avatar className="w-6 h-6">
          <AvatarImage src={decodeURIComponent(customerData.image)} />
          <AvatarFallback>{getInitials(customerData.name[0])}</AvatarFallback>
        </Avatar>
        <Typography variant="small" className="font-semibold" title={customerData.name}>
          {getFilterValue(customerData.name, 15)}
        </Typography>
      </div>
      <div className="space-y-1 flex flex-col w-11/12 pl-1">
        {viewType && viewType == "project" ? (
          <div className="flex gap-1 items-center">
            <Typography variant="small" className=" text-muted-foreground">
              {resourceAllocation.employee}
            </Typography>
            <Typography variant="small" className=" text-muted-foreground" title={resourceAllocation.employee_name}>
              {"("}
              {getFilterValue(resourceAllocation.employee_name, 15)}
              {")"}
            </Typography>
          </div>
        ) : (
          resourceAllocation.project && (
            <div className="flex gap-1 items-center">
              <Typography variant="small" className=" text-muted-foreground">
                {resourceAllocation.project}
              </Typography>
              <Typography variant="small" className=" text-muted-foreground" title={resourceAllocation.project_name}>
                {"("}
                {getFilterValue(resourceAllocation.project_name, 15)}
                {")"}
              </Typography>
            </div>
          )
        )}
        <div className="flex gap-1 items-center">
          <Typography variant="small" className=" text-muted-foreground">
            {startDate} - {endDate}
          </Typography>
          <Typography variant="small" className=" text-muted-foreground">
            {"("}
            {resourceAllocation.hours_allocated_per_day} {"hours / day)"}
          </Typography>
        </div>
        <Typography
          className={mergeClassNames(
            "text-xs font-semibold",
            resourceAllocation.is_billable
              ? "bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
              : "text-yellow-500"
          )}
        >
          {resourceAllocation.is_billable ? "Billable ($)" : "Non-billable"}
        </Typography>

        {resourceAllocation.note && (
          <div className="note-section mt-2 flex items-center gap-1 w-11/12" title={"Note"}>
            <Typography variant="small" className=" text-gray-600 italic">
              Note : {getFilterValue(resourceAllocation.note, 150)}
            </Typography>
          </div>
        )}

        <div className=" absolute right-4 top-0 flex gap-1 cursor-pointer">
          {resourceAllocationPermission.write && (
            <>
              <Pencil
                className="w-4 hover:text-yellow-500"
                size={16}
                strokeWidth={1.25}
                aria-label="Edit"
                onClick={handleResourceAllocationEdit}
              />
              <Clipboard
                size={16}
                strokeWidth={1.25}
                className="w-4 hover:text-green-500"
                aria-label="Copy"
                onClick={handleResourceAllocationCopy}
              />
            </>
          )}
          {resourceAllocationPermission.delete && (
            <DeleteIcon
              resourceAllocation={resourceAllocation}
              resourceAllocationPermission={resourceAllocationPermission}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
};
