import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
  ResourceCustomerProps,
} from "@/types/resource_management";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { ResourceAllocationList } from "../../components/Card";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { daysDiff, getRelativeEndDate, getRelativeStartDate } from "../../utils/helper";

export const CustomerAllocationList = ({
  employeeAllocations,
  cellWidth,
  heightFactor,
  cellHeight,
}: {
  employeeAllocations: ResourceAllocationObjectProps;
  cellWidth: number;
  cellHeight: number;
  heightFactor: number;
}) => {
  const allocationList: ResourceAllocationProps[] = useMemo(() => {
    // Need to fix this
    const employeeAllocationsList: ResourceAllocationProps[] = Object.values(employeeAllocations);
    const newEmployeeAllocationsList: ResourceAllocationProps[] = [];

    for (let index1 = 0; index1 < employeeAllocationsList.length; index1++) {
      const resourceAllocation = employeeAllocationsList[index1];
      let numberDays: number = 0;

      for (let i = 0; i < newEmployeeAllocationsList.length; i++) {
        const allocation = newEmployeeAllocationsList[i];

        if (
          !(
            getRelativeStartDate(resourceAllocation.allocation_start_date) >
              getRelativeEndDate(allocation.allocation_end_date) ||
            getRelativeEndDate(resourceAllocation.allocation_end_date) <
              getRelativeStartDate(allocation.allocation_start_date)
          )
        ) {
          numberDays += allocation.numberDays || 1;
        }
      }
      const newResourceAllocation = { ...resourceAllocation, numberDays };
      newEmployeeAllocationsList.push(newResourceAllocation);
    }

    return newEmployeeAllocationsList;
  }, [employeeAllocations]);

  return (
    <div
      className={cn("absolute top-0 left-0 flex flex-col overflow-hidden")}
      style={{ height: cellHeight ? `${cellHeight}rem` : "auto", width: cellWidth ? `${cellWidth}rem` : "auto" }}
    >
      {allocationList.map((resourceAllocation: ResourceAllocationProps, index: number) => {
        return (
          <CustomerAllocationRow
            key={resourceAllocation.name}
            heightFactor={heightFactor}
            cellWidth={cellWidth}
            employeeAllocations={Object.values(employeeAllocations)}
            resourceAllocation={resourceAllocation}
            index={index}
          />
        );
      })}
    </div>
  );
};

export const CustomerAllocationRow = ({
  resourceAllocation,
  employeeAllocations,
  cellWidth,
  heightFactor,
  index,
}: {
  employeeAllocations: ResourceAllocationProps[];
  index: number;
  heightFactor: number;
  resourceAllocation: ResourceAllocationProps;
  cellWidth: number;
}) => {
  const getAllocationColor = (value: number, billable: number) => {
    return billable ? `bg-gradient-to-r from-green-300 to-green-500` : `bg-yellow-400/80`;
  };
  const resourceTeamStateDates = useSelector((state: RootState) => state.resource_team.data.dates);
  const customer: ResourceCustomerObjectProps = useSelector((state: RootState) => state.resource_team.data.customer);
  const customerData: ResourceCustomerProps = customer[resourceAllocation.customer];

  const allocationStartDate: string = useMemo(() => {
    return getRelativeStartDate(resourceAllocation.allocation_start_date);
  }, [resourceAllocation.allocation_start_date]);

  const allocationEndDate: string = useMemo(() => {
    return getRelativeEndDate(resourceAllocation.allocation_end_date);
  }, [resourceAllocation.allocation_end_date]);

  const width: number = useMemo(() => {
    const diff = daysDiff(allocationStartDate, allocationEndDate);

    if (diff == 0) {
      return cellWidth;
    }
    return (diff + 1) * cellWidth;
  }, [allocationEndDate, allocationStartDate, cellWidth]);

  const leftMargin: number = useMemo(() => {
    if (resourceTeamStateDates.length > 0) {
      const startDate: string = resourceTeamStateDates[0].start_date;
      const diff = daysDiff(startDate, allocationStartDate);
      return diff * cellWidth;
    }
    return 0;
  }, [resourceTeamStateDates, allocationStartDate, cellWidth]);

  const topMargin: number = useMemo(() => {
    return heightFactor * (resourceAllocation.numberDays as number);
  }, [heightFactor, resourceAllocation.numberDays]);

  return (
    <HoverCard openDelay={1}>
      <HoverCardTrigger asChild className="cursor-pointer text-center">
        <div
          className={cn("rounded flex items-center justify-center text-xs text-white absolute z-10")}
          style={{
            width: `${width}px`,
            left: `${leftMargin}px`,
            height: `${heightFactor}px`,
            top: `${topMargin}px`,
          }}
        >
          <div
            className={cn(
              "flex items-center w-full h-full py-1.5 pl-3 gap-1 rounded border text-xs text-white absolute",
              getAllocationColor(resourceAllocation.hours_allocated_per_day, resourceAllocation.is_billable)
            )}
          >
            {customerData && (
              <>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={decodeURIComponent(customerData.image)} />
                  <AvatarFallback>{customerData.abbr}</AvatarFallback>
                </Avatar>
                <p className="text-xs">{customerData.abbr}</p>
              </>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent>
        <ResourceAllocationList resourceAllocationList={[resourceAllocation]} />
      </HoverCardContent>
    </HoverCard>
  );
};
