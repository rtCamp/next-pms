/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  GanttGrid,
  Spinner,
  Typography,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { isWeekendEntryAllowed } from "@/lib/utils";
import { useAllocationOutletContext } from "@/pages/allocations/allocationOutletContext";
import { useUnsavedChangesSource } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useUser } from "@/providers/user";
import { useAllocationsProject } from "./context";
import { SubHeader } from "./subHeader";
import { ALLOCATIONS_PAGE_SIZE } from "../constants";

export const AllocationsProjectTable = () => {
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
  const loadMore = useAllocationsProject(({ actions }) => actions.loadMore);

  const ganttRef = useUnsavedChangesSource();

  const roles = useUser(({ state }) => state.roles);
  const canManageAllocations =
    roles.includes("Projects Manager") || roles.includes("Projects User");

  const {
    openAddAllocationDialog,
    openEditAllocationDialog,
    openDeleteAllocationDialog,
  } = useAllocationOutletContext();
  const showWeekend = isWeekendEntryAllowed();
  const hasProjects = projects.length > 0;
  const isRefreshingVisibleGrid = isQueryLoading && hasProjects;
  const showOverlay = isQueryLoading;

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <SubHeader />
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
              hasRoleAccess={canManageAllocations}
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
