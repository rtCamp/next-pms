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
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import {
  DotHorizontal,
  SmallLeftChevron,
  SmallRightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { isWeekendEntryAllowed } from "@/lib/utils";
import { useAllocationOutletContext } from "@/pages/allocations/allocationOutletContext";
import { useUser } from "@/providers/user";
import { EMPLOYEES_PER_PAGE } from "./constants";
import { useAllocationsTeam } from "./context";
import {
  allocationsFilters,
  allocationsTypeOptions,
  durationOptions,
  navigationButtonAriaLabels,
} from "../constants";

export const AllocationsTeamTable = () => {
  const searchInput = useAllocationsTeam(({ state }) => state.searchInput);
  const duration = useAllocationsTeam(({ state }) => state.duration);
  const weekCount = useAllocationsTeam(({ state }) => state.weekCount);
  const isQueryLoading = useAllocationsTeam(
    ({ state }) => state.isQueryLoading,
  );
  const isNextPageLoading = useAllocationsTeam(
    ({ state }) => state.isNextPageLoading,
  );
  const hasMore = useAllocationsTeam(({ state }) => state.hasMore);
  const members = useAllocationsTeam(({ state }) => state.members);
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
  } = useAllocationOutletContext();

  const showWeekend = isWeekendEntryAllowed();
  const hasMembers = members.length > 0;
  const isRefreshingVisibleGrid = isQueryLoading && hasMembers;
  const showOverlay = isQueryLoading;

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
            options={durationOptions}
            value={duration}
            onChange={(value) =>
              setDuration((value || "this-quarter") as typeof duration)
            }
          />
          <Select
            placeholder="Allocations Type"
            className="w-fit"
            options={allocationsTypeOptions}
            value={allocationsType}
            onChange={(value) => setAllocationsType(value ?? "all")}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              icon={() => (
                <SmallLeftChevron className="size-4 text-ink-gray-9" />
              )}
              onClick={handlePrevious}
              aria-label={navigationButtonAriaLabels["previous"][duration]}
            />
            <Button variant="ghost" label="Today" onClick={handleToday} />
            <Button
              variant="ghost"
              icon={() => (
                <SmallRightChevron className="size-4 text-ink-gray-9" />
              )}
              onClick={handleNext}
              aria-label={navigationButtonAriaLabels["next"][duration]}
            />
          </div>
          <Filter
            align="end"
            fields={allocationsFilters}
            value={compositeFilters}
            onChange={(newFilters: FilterCondition[]) => {
              setCompositeFilters(newFilters);
            }}
          />
          <Button
            aria-label="More options"
            icon={() => <DotHorizontal className="size-4 text-ink-gray-9" />}
          />
        </div>
      </div>
      {/* 112px is the height of header and filters section */}
      <div className="relative w-full h-[calc(100vh-112px)]">
        {hasMembers ? (
          <InfiniteScroll
            isLoading={isQueryLoading || isNextPageLoading}
            hasMore={hasMore}
            verticalLodMore={loadMore}
            className={cn("w-full h-full overflow-auto no-scrollbar", {
              "opacity-50 transition-opacity duration-150 pointer-events-none":
                isRefreshingVisibleGrid,
            })}
            skeletonClassName="h-15"
            count={EMPLOYEES_PER_PAGE}
          >
            <GanttGrid
              startDate={anchorDate}
              members={members}
              weekCount={weekCount}
              hasRoleAccess={hasRoleAccess}
              showWeekend={showWeekend}
              onAddAllocation={openAddAllocationDialog}
              onEditAllocation={openEditAllocationDialog}
              onDeleteAllocation={openDeleteAllocationDialog}
            />
          </InfiniteScroll>
        ) : null}

        {!isQueryLoading && !hasMembers ? (
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
