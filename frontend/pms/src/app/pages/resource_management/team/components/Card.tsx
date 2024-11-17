import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import {
  ResourceCustomerProps,
  ResourceCustomerObjectProps,
  ResourceAllocationProps,
} from "@/types/resource_management";
import { useSelector } from "react-redux";
import { getInitials } from "../utils/helper";

export const ResourceAllocationList = ({
  resourceAllocationList,
}: {
  resourceAllocationList: ResourceAllocationProps[];
}) => {
  console.log(resourceAllocationList);
  return (
    <div className="space-y-4">
      {resourceAllocationList.map((resourceAllocation: ResourceAllocationProps) => (
        <ResourceAllocationCard key={resourceAllocation.name} resourceAllocation={resourceAllocation} />
      ))}
    </div>
  );
};

export const ResourceAllocationCard = ({ resourceAllocation }: { resourceAllocation: ResourceAllocationProps }) => {
  const customer: ResourceCustomerObjectProps = useSelector((state: RootState) => state.resource_team.data.customer);

  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="w-10 h-10">
        <AvatarImage src={decodeURIComponent(customerData.image)} />
        <AvatarFallback>{getInitials(customerData.name)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{customerData.name}</h4>
        <p className="text-xs text-muted-foreground">
          {resourceAllocation.project} - {resourceAllocation.project_name}
        </p>
        <p className="text-xs text-muted-foreground">{resourceAllocation.hours_allocated_per_day} hours</p>
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
      </div>
    </div>
  );
};
