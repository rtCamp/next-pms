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
  MultiSelect,
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
import {
  useGuardedAction,
  useUnsavedChangesSource,
} from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useUser } from "@/providers/user";
import { useAllocationsProject } from "./context";
import {
  ALLOCATIONS_PAGE_SIZE,
  durationOptions,
  navigationButtonAriaLabels,
} from "../constants";
import {
  projectAllocationFilters,
  projectBaseAllocationFilters,
  projectAllocationsTypeOptions,
} from "./constants";

export const AllocationsProjectTable = () => {
  const searchInput = useAllocationsProject(({ state }) => state.searchInput);
  const duration = useAllocationsProject(({ state }) => state.duration);
  const weekCount = useAllocationsProject(({ state }) => state.weekCount);
  const isQueryLoading = useAllocationsProject(
    ({ state }) => state.isQueryLoading,
  );
  const isNextPageLoading = useAllocationsProject(
    ({ state }) => state.isNextPageLoading,
  );
  const hasMore = useAllocationsProject(({ state }) => state.hasMore);
  const projects = useAllocationsProject(({ state }) => state.projects);
  const anchorDate = useAllocationsProject(({ state }) => state.anchorDate);
  const allocationsType = useAllocationsProject(
    ({ state }) => state.allocationsType,
  );
  const compositeFilters = useAllocationsProject(
    ({ state }) => state.compositeFilters,
  );

  const setSearch = useAllocationsProject(({ actions }) => actions.setSearch);
  const setDuration = useAllocationsProject(
    ({ actions }) => actions.setDuration,
  );
  const setAllocationsType = useAllocationsProject(
    ({ actions }) => actions.setAllocationsType,
  );
  const setCompositeFilters = useAllocationsProject(
    ({ actions }) => actions.setCompositeFilters,
  );
  const loadMore = useAllocationsProject(({ actions }) => actions.loadMore);
  const handlePrevious = useAllocationsProject(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsProject(
    ({ actions }) => actions.handleToday,
  );
  const handleNext = useAllocationsProject(({ actions }) => actions.handleNext);

  const guard = useGuardedAction();
  const ganttRef = useUnsavedChangesSource();

  const { hasRoleAccess, roles } = useUser(({ state }) => ({
    hasRoleAccess: state.hasRoleAccess,
    roles: state.roles,
  }));
  const canUsePrivilegedFilters =
    roles.includes("Projects Manager") || roles.includes("Projects User");

  const {
    openAddAllocationDialog,
    openEditAllocationDialog,
    openDeleteAllocationDialog,
  } = useAllocationOutletContext();
  const [isAllocationTypeOpen, setIsAllocationTypeOpen] = useState(false);

  const showWeekend = isWeekendEntryAllowed();
  const hasProjects = projects.length > 0;
  const isRefreshingVisibleGrid = isQueryLoading && hasProjects;
  const showOverlay = isQueryLoading;
  const filterFields = canUsePrivilegedFilters
    ? projectAllocationFilters
    : projectBaseAllocationFilters;

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <div className="w-full flex flex-wrap gap-2 justify-between px-5">
        <div className="flex flex-wrap gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search project"
            onChange={(e) => guard(() => setSearch(e.target.value))}
            value={searchInput}
          />
          <Select
            placeholder="Duration"
            className="w-fit"
            options={durationOptions}
            value={duration}
            onChange={(value) =>
              guard(() =>
                setDuration((value || "this-quarter") as typeof duration),
              )
            }
          />
          {canUsePrivilegedFilters ? (
            <div className="w-fit max-w-42">
              <MultiSelect
                options={projectAllocationsTypeOptions}
                value={allocationsType}
                placeholder="Allocation type"
                onChange={(value) => guard(() => setAllocationsType(value))}
                open={isAllocationTypeOpen}
                onOpenChange={(open) =>
                  guard(() => setIsAllocationTypeOpen(open))
                }
                hideSearch={true}
                popupClassName="w-48"
                renderFooter={({ clearAll }) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="subtle"
                      label="Clear"
                      className="justify-start"
                      onClick={() => {
                        clearAll();
                        setIsAllocationTypeOpen(false);
                      }}
                    />
                  </div>
                )}
              />
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              icon={() => (
                <SmallLeftChevron className="size-4 text-ink-gray-9" />
              )}
              onClick={() => guard(handlePrevious)}
              aria-label={navigationButtonAriaLabels["previous"][duration]}
            />
            <Button
              variant="ghost"
              label="Today"
              onClick={() => guard(handleToday)}
            />
            <Button
              variant="ghost"
              icon={() => (
                <SmallRightChevron className="size-4 text-ink-gray-9" />
              )}
              onClick={() => guard(handleNext)}
              aria-label={navigationButtonAriaLabels["next"][duration]}
            />
          </div>
          <Filter
            align="end"
            fields={filterFields}
            value={compositeFilters}
            onChange={(value) => guard(() => setCompositeFilters(value))}
          />
          <Button
            aria-label="More options"
            icon={() => <DotHorizontal className="size-4 text-ink-gray-9" />}
          />
        </div>
      </div>
      <div className="relative w-full h-[calc(100vh-112px)]">
        {hasProjects ? (
          <InfiniteScroll
            isLoading={isQueryLoading || isNextPageLoading}
            hasMore={hasMore}
            verticalLodMore={loadMore}
            className={cn("w-full h-full overflow-auto no-scrollbar", {
              "opacity-50 transition-opacity duration-150 pointer-events-none":
                isRefreshingVisibleGrid,
            })}
            skeletonClassName="h-15"
            count={ALLOCATIONS_PAGE_SIZE}
          >
            <GanttGrid
              ref={ganttRef}
              variant="project"
              startDate={anchorDate}
              projects={projects}
              rowHeaderLabel="Projects"
              weekCount={weekCount}
              hasRoleAccess={hasRoleAccess}
              showWeekend={showWeekend}
              onAddAllocation={openAddAllocationDialog}
              onEditAllocation={openEditAllocationDialog}
              onDeleteAllocation={openDeleteAllocationDialog}
            />
          </InfiniteScroll>
        ) : null}

        {!isQueryLoading && !hasProjects ? (
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
