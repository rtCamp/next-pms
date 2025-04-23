/**
 * External dependencies.
 */
import { mergeClassNames } from "@next-pms/design-system/utils";

/**
 * Internal dependencies.
 */
import type {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { ResourceAllocationCard } from "./resourceAllocationCard";
import type { AllocationDataProps } from "../../store/types";

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
  return (
    <div className={mergeClassNames("flex flex-col items-center overflow-y-auto max-h-60")}>
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
          onAddButtonClick={onButtonClick}
        />
      ))}
    </div>
  );
};
