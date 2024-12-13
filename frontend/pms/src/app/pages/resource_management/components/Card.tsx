import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn, prettyDate } from "@/lib/utils";
import {
  ResourceCustomerProps,
  ResourceCustomerObjectProps,
  ResourceAllocationProps,
  ResourceAllocationObjectProps,
} from "@/types/resource_management";
import { useDispatch, useSelector } from "react-redux";
import { getFilterValue, getInitials } from "../utils/helper";
import { Clipboard, Pencil, Plus, Trash2 } from "lucide-react";
import { useFrappeDeleteDoc } from "frappe-react-sdk";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import { setReFetchData } from "@/store/resource_management/team";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";

export const ResourceAllocationList = ({
  resourceAllocationList,
  employeeAllocations,
  customer,
  onButtonClick,
}: {
  resourceAllocationList: ResourceAllocationProps[];
  employeeAllocations?: ResourceAllocationObjectProps;
  customer: ResourceCustomerObjectProps;
  onButtonClick?: () => void;
}) => {
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  return (
    <div className={cn("flex flex-col overflow-y-scroll max-h-60", !resourceAllocationPermission.write && "pl-7")}>
      {resourceAllocationList.map((resourceAllocation: ResourceAllocationProps) => (
        <ResourceAllocationCard
          key={resourceAllocation.name}
          resourceAllocation={
            employeeAllocations
              ? { ...resourceAllocation, ...employeeAllocations[resourceAllocation.name] }
              : resourceAllocation
          }
          customer={customer}
        />
      ))}
      {resourceAllocationPermission.write && onButtonClick && (
        <Button
          title={"Add Resource Allocation"}
          className={cn("p-1 ml-2 h-fit text-xs w-11/12")}
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

export const ResourceAllocationCard = ({
  resourceAllocation,
  customer,
}: {
  resourceAllocation: ResourceAllocationProps;
  customer: ResourceCustomerObjectProps;
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
    <div
      className="flex items-center gap-4 relative mt-2 mb-4
    "
    >
      <Avatar className="w-6 h-6">
        <AvatarImage src={decodeURIComponent(customerData.image)} />
        <AvatarFallback>{getInitials(customerData.name)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1 flex items-start flex-col">
        <p className="text-xs font-semibold" title={customerData.name}>
          {getFilterValue(customerData.name, 15)}
        </p>
        {resourceAllocation.project && (
          <>
            <p className="text-xs text-muted-foreground">{resourceAllocation.project}</p>
            <p className="text-xs text-muted-foreground">{getFilterValue(resourceAllocation.project_name, 15)}</p>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          {startDate} - {endDate}
        </p>
        <p className="text-xs text-muted-foreground">{resourceAllocation.hours_allocated_per_day} hours / day</p>
        <p
          className={cn(
            "text-xs font-semibold",
            resourceAllocation.is_billable
              ? "bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
              : "text-yellow-500"
          )}
        >
          {resourceAllocation.is_billable ? "Billable" : "Non-billable"}
        </p>

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
