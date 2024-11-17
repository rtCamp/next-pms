import { EmployeeSingleDayProps } from "@/store/resource_management/team";
import { DateProps } from "@/store/team";
import { ResourceAllocationProps } from "@/types/resource_management";

interface CombinedResourceData {
  [key: string]: {
    project_name: string;
    total_allocated_hours: number;
    all_allocation: {
      [date: string]: {
        allocations: ResourceAllocationProps[];
        total_allocated_hours: number;
        total_worked_hours_resource_allocation: number;
      };
    };
  };
}

function groupAllocations(
  resourceData: EmployeeSingleDayProps[],
  dates: DateProps[]
  //   isGroupByProject: boolean = true
): { combinedResourceData: CombinedResourceData; allDates: string[] } {
  let allResourceAllocation: ResourceAllocationProps[] = [];
  let allDates: string[] = [];

  for (let index = 0; index < dates.length; index++) {
    allDates = allDates.concat(dates[index].dates);
  }

  for (let index = 0; index < resourceData.length; index++) {
    allResourceAllocation = allResourceAllocation.concat(
      resourceData[index].employee_resource_allocation_for_given_date
    );
  }
  const combinedResourceData: CombinedResourceData = {};

  for (let index = 0; index < allResourceAllocation.length; index++) {
    const resource = allResourceAllocation[index];

    if (!(resource.project in combinedResourceData)) {
      combinedResourceData[resource.project] = {
        project_name: resource.project_name,
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

  console.log(combinedResourceData);

  return {
    combinedResourceData: combinedResourceData,
    allDates: allDates,
  };
}

export { groupAllocations };
