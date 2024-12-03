import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn, prettyDate } from "@/lib/utils";
import { RootState } from "@/store";
import {
  ResourceCustomerProps,
  ResourceCustomerObjectProps,
  ResourceAllocationProps,
} from "@/types/resource_management";
import { useDispatch, useSelector } from "react-redux";
import { getInitials } from "../utils/helper";
import { Clipboard, Pencil, Trash2 } from "lucide-react";
import { useFrappeDeleteDoc } from "frappe-react-sdk";
import { setResourceFormData } from "@/store/resource_management/allocation";
import { toast } from "@/app/components/ui/use-toast";
import { setReFetchData } from "@/store/resource_management/team";

export const ResourceAllocationList = ({
  resourceAllocationList,
  employeeAllocations,
}: {
  resourceAllocationList: ResourceAllocationProps[];
  employeeAllocations?: ResourceAllocationObjectProps;
}) => {
  return (
    <div>
      {resourceAllocationList.map((resourceAllocation: ResourceAllocationProps) => (
        <ResourceAllocationCard
          key={resourceAllocation.name}
          resourceAllocation={
            employeeAllocations
              ? { ...resourceAllocation, ...employeeAllocations[resourceAllocation.name] }
              : resourceAllocation
          }
        />
      ))}
    </div>
  );
};

export const ResourceAllocationCard = ({ resourceAllocation }: { resourceAllocation: ResourceAllocationProps }) => {
  const customer: ResourceCustomerObjectProps = useSelector((state: RootState) => state.resource_team.data.customer);

  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];

  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);
  const dispatch = useDispatch();

  const { deleteDoc } = useFrappeDeleteDoc();

  const handleResourceAllocationDelete = () => {
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
      <Avatar className="w-10 h-10">
        <AvatarImage src={decodeURIComponent(customerData.image)} />
        <AvatarFallback>{getInitials(customerData.name)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1 flex items-start flex-col">
        <p className="text-xs font-semibold">
          {" "}
          {customerData.name.length > 15 ? `${customerData.name.slice(0, 15)}...` : customerData.name}
        </p>
        <p className="text-xs text-muted-foreground">{resourceAllocation.project}</p>
        <p className="text-xs text-muted-foreground">{resourceAllocation.project_name}</p>
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
        <div className=" absolute right-0 top-0 flex gap-1 cursor-pointer">
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
          <Trash2
            className="w-4 hover:text-red-500"
            size={16}
            strokeWidth={1.25}
            aria-label="Delete"
            onClick={handleResourceAllocationDelete}
          />
        </div>
      </div>
    </div>
  );
};
