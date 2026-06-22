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
import { useAllocationsTeam } from "./context";
import { SubHeader } from "./subHeader";
import { ALLOCATIONS_PAGE_SIZE } from "../constants";

export const AllocationsTeamTable = () => {
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
  const loadMore = useAllocationsTeam(({ actions }) => actions.loadMore);

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
  const hasMembers = members.length > 0;
  const isRefreshingVisibleGrid = isQueryLoading && hasMembers;
  const showOverlay = isQueryLoading;

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <SubHeader />
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
            count={ALLOCATIONS_PAGE_SIZE}
          >
            <GanttGrid
              ref={ganttRef}
              variant="team"
              startDate={anchorDate}
              members={members}
              rowHeaderLabel="Members"
              weekCount={weekCount}
              hasRoleAccess={canManageAllocations}
              showWeekend={showWeekend}
              onAddAllocation={openAddAllocationDialog}
              onEditAllocation={openEditAllocationDialog}
              onDeleteAllocation={openDeleteAllocationDialog}
            />
          </InfiniteScroll>
        ) : null}

        {!isQueryLoading && !hasMembers ? (
          <Typography className="flex items-center justify-center h-full">
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
