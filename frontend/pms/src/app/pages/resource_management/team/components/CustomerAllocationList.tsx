import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
  ResourceCustomerProps,
} from "@/types/resource_management";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { ResourceAllocationList } from "./Card";
import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

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
  return (
    <div
      className={cn("absolute top-0 left-0 flex flex-col overflow-hidden")}
      style={{ height: cellHeight ? `${cellHeight}rem` : "auto", width: cellWidth ? `${cellWidth}rem` : "auto" }}
    >
      {Object.entries(employeeAllocations).map(
        ([name, resourceAllocation]: [string, ResourceAllocationProps], index: number) => {
          return (
            <CustomerAllocationRow
              key={name}
              heightFactor={heightFactor}
              cellWidth={cellWidth}
              employeeAllocations={Object.values(employeeAllocations)}
              resourceAllocation={resourceAllocation}
              index={index}
            />
          );
        }
      )}
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

  const daysDiff = useCallback(
    (date1: string, date2: string) => {
      const start = new Date(date1);
      const end = new Date(date2);

      const diff = end.getTime() - start.getTime();

      if (diff == 0) {
        return 0;
      }

      let weekendDays: number = 0;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) {
          weekendDays++;
        }
      }
      return Math.floor(diff / (1000 * 60 * 60 * 24)) - weekendDays;
    },
    [cellWidth]
  );

  const width: number = useMemo(() => {
    const start: string = resourceAllocation.allocation_start_date;
    let end: string = resourceAllocation.allocation_end_date;
    if (resourceTeamStateDates && resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date <= end) {
      end = resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date;
    }

    const diff = daysDiff(start, end);

    if (diff == 0) {
      return cellWidth;
    }
    return (diff + 1) * cellWidth;
  }, [cellWidth, daysDiff, resourceAllocation.allocation_end_date, resourceAllocation.allocation_start_date]);

  const left: number = useMemo(() => {
    if (resourceTeamStateDates.length > 0) {
      const startDate: string = resourceTeamStateDates[0].start_date;
      const diff = daysDiff(startDate, resourceAllocation.allocation_start_date);
      return diff * cellWidth;
    }
    return 0; // Provide a default value
  }, [resourceTeamStateDates, daysDiff, resourceAllocation.allocation_start_date, cellWidth]);

  const top: number = useMemo(() => {
    const startDate: string = resourceAllocation.allocation_start_date;

    let numberDays: number = 0;

    for (let i = 0; i < index; i++) {
      const allocation = employeeAllocations[i];
      const allocationStartDate: string = allocation.allocation_start_date;
      const allocationEndDate: string = allocation.allocation_end_date;

      if (startDate >= allocationStartDate && startDate <= allocationEndDate) {
        numberDays++;
      }
    }

    return numberDays * heightFactor;
  }, [resourceAllocation.allocation_start_date, heightFactor, index, employeeAllocations]);

  return (
    <HoverCard openDelay={1}>
      <HoverCardTrigger asChild className="cursor-pointer text-center">
        <div
          className={cn("rounded flex items-center justify-center text-xs text-white absolute z-10")}
          style={{
            width: `${width}px`,
            left: `${left}px`,
            height: `${heightFactor}px`,
            top: `${top}px`,
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
