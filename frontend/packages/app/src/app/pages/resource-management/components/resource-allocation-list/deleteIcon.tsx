/**
 * External dependencies.
 */
import { useState } from "react";
import { useToast } from "@next-pms/design-system/components";
import { DeleteConfirmationDialog } from "@next-pms/design-system/components";
import { useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { ResourceAllocationProps } from "@/types/resource_management";
import type { AllocationDataProps, PermissionProps } from "../../store/types";

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
            resourceAllocation as unknown as AllocationDataProps,
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
