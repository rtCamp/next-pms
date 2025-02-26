/**
 * External dependencies.
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage, Button, useToast, Typography } from "@next-pms/design-system/components";
import { DeleteConfirmationDialog } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { cn } from "@next-pms/design-system/utils";
import { getFilterValue, getFormatedStringValue } from "@next-pms/resource-management/utils";
import { useFrappeDeleteDoc } from "frappe-react-sdk";
import { Clipboard, Pencil, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
  ResourceCustomerProps,
} from "@/types/resource_management";

import { getInitials } from "../utils/helper";

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
  onSubmit,
}: {
  resourceAllocationList: ResourceAllocationProps[];
  employeeAllocations?: ResourceAllocationObjectProps;
  customer: ResourceCustomerObjectProps;
  viewType?: string;
  onButtonClick?: () => void;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  return (
    <div className={cn("flex flex-col items-center overflow-y-auto max-h-60")}>
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
          onSubmit={onSubmit}
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
  onSubmit,
}: {
  resourceAllocation: ResourceAllocationProps;
  customer: ResourceCustomerObjectProps;
  viewType?: string;
  isLastItem: boolean;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { date: startDate } = prettyDate(resourceAllocation.allocation_start_date);
  const { date: endDate } = prettyDate(resourceAllocation.allocation_end_date);
  const dispatch = useDispatch();

  const handleResourceAllocationEdit = () => {
    if (!resourceAllocationPermission.write) {
      return;
    }
    dispatch(
      setResourceFormData({
        isShowDialog: true,
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
          className={cn(
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

/**
 * The delete icon's confirm box wrapper.
 *
 * @param props.resourceAllocation The resource allocation object.
 * @param props.resourceAllocationPermission The resource allocation permission object.
 * @returns
 */
const DeleteIcon = ({
  resourceAllocation,
  resourceAllocationPermission,
  onSubmit,
  buttonClassName,
}: {
  resourceAllocation: ResourceAllocationProps;
  resourceAllocationPermission: PermissionProps;
  onSubmit?: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  buttonClassName?: string;
}) => {
  const { toast } = useToast();
  const { deleteDoc } = useFrappeDeleteDoc();

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleResourceAllocationDelete = () => {
    if (!resourceAllocationPermission.delete) {
      return;
    }

    setIsLoading(true);

    deleteDoc("Resource Allocation", resourceAllocation.name)
      .then(() => {
        toast({
          variant: "success",
          description: "Resouce allocation deleted successfully",
        });
        if (onSubmit) {
          onSubmit(
            resourceAllocation as unknown as AllocationDataProps,
            resourceAllocation as unknown as AllocationDataProps
          );
          setIsOpen(false);
        }
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to delete resource allocation",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <DeleteConfirmationDialog
      onDelete={handleResourceAllocationDelete}
      isLoading={isLoading}
      buttonClassName={buttonClassName}
      isOpen={isOpen}
      onOpen={() => {
        setIsOpen(true);
      }}
      onCancel={() => {
        setIsOpen(false);
      }}
      title="Are you sure you want to delete this allocation?"
      description="This action cannot be undone. This will permanently delete the given allocation."
    />
  );
};

export { DeleteIcon };
