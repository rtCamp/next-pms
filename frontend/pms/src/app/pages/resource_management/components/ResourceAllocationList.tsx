/**
 * External dependencies.
 */
import { useDispatch, useSelector } from "react-redux";
import { useFrappeDeleteDoc } from "frappe-react-sdk";
import { Clipboard, Pencil, Plus, Trash2, ShieldAlert } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import { cn, prettyDate } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import { setReFetchData } from "@/store/resource_management/team";
import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
  ResourceCustomerProps,
} from "@/types/resource_management";
import { getFilterValue, getInitials } from "../utils/helper";

/**
 * This component is responsible for rendering the list of resource allocations in Card.
 *
 * @param props.resourceAllocationList The list of resource allocation whihc can have list of allocation names or allocation objects
 * @param props.employeeAllocations The employee allocations.
 * @param props.customer The customer object which holds the customer data.
 * @param props.onButtonClick The on button click event.
 * @param props.viewType The view type of resource page, team or project.
 * @returns React.FC
 */
export const ResourceAllocationList = ({
  resourceAllocationList,
  employeeAllocations,
  customer,
  onButtonClick,
  viewType,
}: {
  resourceAllocationList: ResourceAllocationProps[];
  employeeAllocations?: ResourceAllocationObjectProps;
  customer: ResourceCustomerObjectProps;
  viewType?: string;
  onButtonClick?: () => void;
}) => {
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center overflow-y-auto max-h-60",
        !resourceAllocationPermission.write && "pl-7"
      )}
    >
      {resourceAllocationList.map((resourceAllocation: ResourceAllocationProps, index: number) => (
        <ResourceAllocationCard
          key={resourceAllocation.name}
          resourceAllocation={
            employeeAllocations
              ? { ...resourceAllocation, ...employeeAllocations[resourceAllocation.name] }
              : resourceAllocation
          }
          customer={customer}
          viewType={viewType}
          isLastItem={index == resourceAllocationList.length - 1}
        />
      ))}
      {resourceAllocationPermission.write && onButtonClick && (
        <Button
          title={"Add Resource Allocation"}
          className={cn("p-1 h-fit text-xs w-11/12")}
          variant={"default"}
          onClick={onButtonClick}
        >
          <Plus className="w-4 max-md:w-3 h-4 max-md:h-3" />
          Add
        </Button>
      )}
    </div>
  );
};

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
}: {
  resourceAllocation: ResourceAllocationProps;
  customer: ResourceCustomerObjectProps;
  viewType?: string;
  isLastItem: number;
}) => {
  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { deleteDoc } = useFrappeDeleteDoc();

  const handleResourceAllocationDelete = () => {
    if (!resourceAllocationPermission.delete) {
      return;
    }
    deleteDoc("Resource Allocation", resourceAllocation.name)
      .then(() => {
        toast({
          variant: "success",
          description: "Resouce allocation deleted successfully",
        });
        dispatch(setReFetchData(true));
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to delete resource allocation",
        });
      });
  };

  const handleResourceAllocationEdit = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }
    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: resourceAllocation.employee,
        project: resourceAllocation.project,
        allocation_start_date: resourceAllocation.allocation_start_date,
        allocation_end_date: resourceAllocation.allocation_end_date,
        is_billable: resourceAllocation.is_billable == 1,
        customer: resourceAllocation.customer,
        total_allocated_hours: resourceAllocation.total_allocated_hours,
        hours_allocated_per_day: resourceAllocation.hours_allocated_per_day,
        note: resourceAllocation.note,
        project_name: resourceAllocation.project_name,
        customer_name: customerData.name,
        isNeedToEdit: true,
        name: resourceAllocation.name,
      })
    );
  };

  const handleResourceAllocationCopy = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: resourceAllocation.employee,
        project: resourceAllocation.project,
        allocation_start_date: resourceAllocation.allocation_start_date,
        allocation_end_date: resourceAllocation.allocation_end_date,
        is_billable: resourceAllocation.is_billable == 1,
        customer: resourceAllocation.customer,
        total_allocated_hours: resourceAllocation.total_allocated_hours,
        hours_allocated_per_day: resourceAllocation.hours_allocated_per_day,
        note: resourceAllocation.note,
        project_name: resourceAllocation.project_name,
        customer_name: customerData.name,
        isNeedToEdit: false,
        name: "",
      })
    );
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 relative mt-2 mb-4 w-full", isLastItem && "mb-3")}>
      <div className="flex gap-1 items-center w-11/12">
        <Avatar className="w-6 h-6">
          <AvatarImage src={decodeURIComponent(customerData.image)} />
          <AvatarFallback>{getInitials(customerData.name[0])}</AvatarFallback>
        </Avatar>
        <p className="text-xs font-semibold" title={customerData.name}>
          {getFilterValue(customerData.name, 15)}
        </p>
      </div>
      <div className="space-y-1 flex flex-col w-11/12 pl-1">
        {viewType && viewType == "project" ? (
          <div className="flex gap-1 items-center">
            <p className="text-xs text-muted-foreground">{resourceAllocation.employee}</p>
            <p className="text-xs text-muted-foreground" title={resourceAllocation.employee_name}>
              {"("}
              {getFilterValue(resourceAllocation.employee_name, 15)}
              {")"}
            </p>
          </div>
        ) : (
          resourceAllocation.project && (
            <div className="flex gap-1 items-center">
              <p className="text-xs text-muted-foreground">{resourceAllocation.project}</p>
              <p className="text-xs text-muted-foreground" title={resourceAllocation.project_name}>
                {"("}
                {getFilterValue(resourceAllocation.project_name, 15)}
                {")"}
              </p>
            </div>
          )
        )}
        <div className="flex gap-1 items-center">
          <p className="text-xs text-muted-foreground">
            {startDate} - {endDate}
          </p>
          <p className="text-xs text-muted-foreground">
            {"("}
            {resourceAllocation.hours_allocated_per_day} {"hours / day)"}
          </p>
        </div>
        <p
          className={cn(
            "text-xs font-semibold",
            resourceAllocation.is_billable
              ? "bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
              : "text-yellow-500"
          )}
        >
          {resourceAllocation.is_billable ? "Billable" : "Non-billable"} ($)
        </p>

        {resourceAllocation.note && (
          <div className="note-section mt-2 flex items-center gap-1 w-11/12" title={"Note"}>
            <p className="text-xs text-gray-600 italic">Note : {getFilterValue(resourceAllocation.note, 150)}</p>
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
            <Trash2
              className="w-4 hover:text-red-500"
              size={16}
              strokeWidth={1.25}
              aria-label="Delete"
              onClick={handleResourceAllocationDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};
