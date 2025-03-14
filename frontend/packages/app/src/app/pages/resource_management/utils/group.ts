/**
 * Internal dependencies.
 */
import type {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
} from "@/types/resource_management";
import type {
  DateProps,
  EmployeeAllocationForDateProps,
  EmployeeResourceObjectProps,
} from "../store/types";

export interface CombinedResourceObjectProps {
  [key: string]: CombinedResourceDataProps;
}

export interface CombinedResourceDataProps {
  project_name: string;
  customer_name?: string;
  total_allocated_hours: number;
  all_allocation: {
    [date: string]: ResourceMergeAllocationProps;
  };
}

export type ResourceMergeAllocationProps = {
  allocations: MergedAllocationProps[];
  total_allocated_hours: number;
  total_worked_hours_resource_allocation: number;
};

export type MergedAllocationProps = EmployeeAllocationForDateProps &
  ResourceAllocationProps;

/**
 * Group the allocations list based on projects.
 *
 * @param resourceData The resource data.
 * @param employee_allocations The employee allocation.
 * @param dates The dates of the allocations.
 * @returns MergedAllocationProps Object.
 */
function groupAllocations(
  resourceData: EmployeeResourceObjectProps,
  employee_allocations: ResourceAllocationObjectProps,
  dates: DateProps[]
): { combinedResourceData: CombinedResourceObjectProps; allDates: string[] } {
  let allResourceAllocation: MergedAllocationProps[] = [];
  let allDates: string[] = [];

  for (let index = 0; index < dates.length; index++) {
    allDates = allDates.concat(dates[index].dates);
  }

  for (let index = 0; index < allDates.length; index++) {
    const date = allDates[index];

    if (date in resourceData) {
      const employee_resource_allocation_for_given_date: EmployeeAllocationForDateProps[] =
        resourceData[date].employee_resource_allocation_for_given_date;

      for (
        let index2 = 0;
        index2 < employee_resource_allocation_for_given_date.length;
        index2++
      ) {
        const allocation: EmployeeAllocationForDateProps =
          employee_resource_allocation_for_given_date[index2];
        allResourceAllocation = allResourceAllocation.concat({
          ...employee_allocations[allocation.name],
          ...allocation,
        });
      }
    }
  }

  const combinedResourceData: CombinedResourceObjectProps = {};

  for (let index = 0; index < allResourceAllocation.length; index++) {
    const resource = allResourceAllocation[index];

    if (!(resource.project in combinedResourceData)) {
      combinedResourceData[resource.project] = {
        project_name: resource.project_name,
        customer_name: resource.customer,
        total_allocated_hours: 0,
        all_allocation: {},
      };
    }

    if (
      !(resource.date in combinedResourceData[resource.project].all_allocation)
    ) {
      combinedResourceData[resource.project].all_allocation[resource.date] = {
        allocations: [],
        total_allocated_hours: 0,
        total_worked_hours_resource_allocation: 0,
      };
    }

    combinedResourceData[resource.project].total_allocated_hours +=
      resource.hours_allocated_per_day;
    combinedResourceData[resource.project].all_allocation[
      resource.date
    ].allocations.push(resource);
    combinedResourceData[resource.project].all_allocation[
      resource.date
    ].total_allocated_hours += resource.hours_allocated_per_day;
    combinedResourceData[resource.project].all_allocation[
      resource.date
    ].total_worked_hours_resource_allocation +=
      resource.total_worked_hours_resource_allocation;
  }

  return {
    combinedResourceData: combinedResourceData,
    allDates: allDates,
  };
}

export { groupAllocations };
