/**
 * External dependencies.
 */
import { useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  GanttGrid,
  Spinner,
  Typography,
} from "@next-pms/design-system/components";
import {
  Button,
  Filter,
  FilterCondition,
  FilterField,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { useUser } from "@/providers/user";
import { EMPLOYEES_PER_PAGE } from "./constants";
import { AllocationsDuration, useAllocationsTeam } from "./context";
import { useAllocationsTeamOutletContext } from "./outletContext";

const FILTER_FIELDS: FilterField[] = [
  {
    fieldCategory: "Timesheet Detail",
    name: "project_name",
    label: "Project",
    type: "string",
  },
  {
    fieldCategory: "Task",
    name: "subject",
    label: "Task",
    type: "string",
  },
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
];

const buttonAriaLabels: Record<
  "next" | "previous",
  Record<AllocationsDuration, string>
> = {
  next: {
    "this-week": "Next Week",
    "this-month": "Next Month",
    "this-quarter": "Next Quarter",
  },
  previous: {
    "this-week": "Previous Week",
    "this-month": "Previous Month",
    "this-quarter": "Previous Quarter",
  },
};

export const AllocationsTeamTable = () => {
  const searchInput = useAllocationsTeam(({ state }) => state.searchInput);
  const duration = useAllocationsTeam(({ state }) => state.duration);
  const weekCount = useAllocationsTeam(({ state }) => state.weekCount);
  const isLoading = useAllocationsTeam(({ state }) => state.isLoading);
  const isFilterRequest = useAllocationsTeam(
    ({ state }) => state.isFilterRequest,
  );
  const hasMore = useAllocationsTeam(({ state }) => state.hasMore);
  const filteredMembers = useAllocationsTeam(
    ({ state }) => state.filteredMembers,
  );
  const anchorDate = useAllocationsTeam(({ state }) => state.anchorDate);
  const [allocationsType, setAllocationsType] = useState("all");
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );

  const setSearch = useAllocationsTeam(({ actions }) => actions.setSearch);
  const setDuration = useAllocationsTeam(({ actions }) => actions.setDuration);
  const loadMore = useAllocationsTeam(({ actions }) => actions.loadMore);
  const handlePrevious = useAllocationsTeam(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsTeam(({ actions }) => actions.handleToday);
  const handleNext = useAllocationsTeam(({ actions }) => actions.handleNext);

  const { hasRoleAccess } = useUser(({ state }) => ({
    hasRoleAccess: state.hasRoleAccess,
  }));

  const {
    openAddAllocationDialog,
    openEditAllocationDialog,
    openDeleteAllocationDialog,
  } = useAllocationsTeamOutletContext();

  const hasMembers = filteredMembers.length > 0;
  const isFilteredDataLoading = isLoading && isFilterRequest;
  const showOverlay = isFilteredDataLoading || (isLoading && !hasMembers);

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <div className="w-full flex flex-wrap gap-2 justify-between px-5">
        <div className="flex flex-wrap gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search members or designation"
            onChange={(e) => setSearch(e.target.value)}
            value={searchInput}
          />
          <Select
            placeholder="Duration"
            className="w-fit"
            options={[
              { label: "This week", value: "this-week" },
              { label: "This month", value: "this-month" },
              { label: "This quarter", value: "this-quarter" },
            ]}
            value={duration}
            onChange={(value) =>
              setDuration((value || "this-quarter") as typeof duration)
            }
          />
          <Select
            placeholder="Allocations Type"
            className="w-fit"
            options={[
              { label: "All", value: "all" },
              { label: "Confirmed only", value: "confirmed" },
              { label: "Tentative only", value: "tentative" },
              { label: "Billable only", value: "billable" },
              { label: "Non-billable only", value: "non-billable" },
            ]}
            value={allocationsType}
            onChange={(value) => setAllocationsType(value ?? "all")}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              icon={() => <ChevronLeft size={16} />}
              onClick={handlePrevious}
              aria-label={buttonAriaLabels["previous"][duration]}
            />
            <Button variant="ghost" label="Today" onClick={handleToday} />
            <Button
              variant="ghost"
              icon={() => <ChevronRight size={16} />}
              onClick={handleNext}
              aria-label={buttonAriaLabels["next"][duration]}
            />
          </div>
          <Filter
            align="end"
            fields={FILTER_FIELDS}
            value={compositeFilters}
            onChange={(newFilters: FilterCondition[]) => {
              setCompositeFilters(newFilters);
            }}
          />
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>
      {/* 112px is the height of header and filters section */}
      <div className="relative w-full h-[calc(100vh-112px)]">
        {hasMembers ? (
          <InfiniteScroll
            isLoading={isLoading}
            hasMore={hasMore}
            verticalLodMore={loadMore}
            className={cn("w-full h-full overflow-auto no-scrollbar", {
              "opacity-50 transition-opacity duration-150 pointer-events-none":
                isFilteredDataLoading,
            })}
            skeletonClassName="h-15"
            count={EMPLOYEES_PER_PAGE}
          >
            <GanttGrid
              startDate={anchorDate}
              members={filteredMembers}
              weekCount={weekCount}
              hasRoleAccess={hasRoleAccess}
              onAddAllocation={openAddAllocationDialog}
              onEditAllocation={openEditAllocationDialog}
              onDeleteAllocation={openDeleteAllocationDialog}
            />
          </InfiniteScroll>
        ) : null}

        {!isLoading && !hasMembers ? (
          <Typography className="flex h-full items-center justify-center">
            No Data
          </Typography>
        ) : null}

        {showOverlay ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center cursor-wait pointer-events-auto">
            <Spinner />
          </div>
        ) : null}
      </div>
    </div>
  );
};
