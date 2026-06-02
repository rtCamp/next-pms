/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  GanttGrid,
  Spinner,
  Typography,
} from "@next-pms/design-system/components";
import {
  Autocomplete,
  Button,
  Filter,
  FilterCondition,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import {
  DotHorizontal,
  SmallDown,
  SmallLeftChevron,
  SmallRightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { useDesignationLookup } from "@/hooks/useDesignationLookup";
import { isWeekendEntryAllowed } from "@/lib/utils";
import { useAllocationOutletContext } from "@/pages/allocations/allocationOutletContext";
import {
  useGuardedAction,
  useUnsavedChangesSource,
} from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useUser } from "@/providers/user";
import { useAllocationsTeam } from "./context";
import {
  ALLOCATIONS_PAGE_SIZE,
  allocationsFilters,
  allocationsTypeOptions,
  durationOptions,
  navigationButtonAriaLabels,
} from "../constants";

export const AllocationsTeamTable = () => {
  const searchInput = useAllocationsTeam(({ state }) => state.searchInput);
  const duration = useAllocationsTeam(({ state }) => state.duration);
  const designation = useAllocationsTeam(({ state }) => state.designation);
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
  const setDesignation = useAllocationsTeam(
    ({ actions }) => actions.setDesignation,
  );
  const loadMore = useAllocationsTeam(({ actions }) => actions.loadMore);
  const handlePrevious = useAllocationsTeam(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsTeam(({ actions }) => actions.handleToday);
  const handleNext = useAllocationsTeam(({ actions }) => actions.handleNext);

  const guard = useGuardedAction();
  const ganttRef = useUnsavedChangesSource();

  const { hasRoleAccess } = useUser(({ state }) => ({
    hasRoleAccess: state.hasRoleAccess,
  }));

  const {
    openAddAllocationDialog,
    openEditAllocationDialog,
    openDeleteAllocationDialog,
  } = useAllocationOutletContext();

  const [designationQuery, setDesignationQuery] = useState("");
  const [isDesignationOpen, setIsDesignationOpen] = useState(false);

  const selectedDesignationOptions = useMemo(
    () =>
      designation.map((selectedDesignation) => ({
        label: selectedDesignation,
        value: selectedDesignation,
      })),
    [designation],
  );

  const { options: designationOptions, isLoading: isDesignationLookupLoading } =
    useDesignationLookup({
      shouldFetch: true,
      query: designationQuery,
      selectedOption: selectedDesignationOptions,
    });

  const showWeekend = isWeekendEntryAllowed();
  const hasMembers = members.length > 0;
  const isRefreshingVisibleGrid = isQueryLoading && hasMembers;
  const showOverlay = isQueryLoading;

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <div className="flex flex-wrap justify-between w-full gap-2 px-5">
        <div className="flex flex-wrap gap-2">
          <TextInput
            placeholder="Search members"
            onChange={(e) => guard(() => setSearch(e.target.value))}
            value={searchInput}
          />
          <Autocomplete
            className="w-42"
            bodyClasses="w-64"
            listClassName="scrollbar-thin"
            placeholder="Designation"
            options={designationOptions}
            multiple
            value={designation}
            open={isDesignationOpen}
            searchValue={designationQuery}
            loading={isDesignationLookupLoading}
            onOpenChange={(value) => guard(() => setIsDesignationOpen(value))}
            onSearchChange={setDesignationQuery}
            onChange={(value) =>
              guard(() =>
                setDesignation(Array.isArray(value) ? value.map(String) : []),
              )
            }
            renderFooter={({ clearAll, selectedOption }) => {
              const hasSelectedDesignation = Array.isArray(selectedOption)
                ? selectedOption.length > 0
                : Boolean(selectedOption);
              const hasActiveDesignationFilter =
                hasSelectedDesignation || Boolean(designationQuery);

              return (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="subtle"
                    label="Clear"
                    className="justify-start"
                    disabled={!hasActiveDesignationFilter}
                    onClick={() => {
                      clearAll();
                      setDesignationQuery("");
                      setIsDesignationOpen(false);
                    }}
                  />
                </div>
              );
            }}
          >
            {({ displayValue }) => (
              <Button
                variant="subtle"
                className="justify-between w-full"
                iconRight={() => (
                  <SmallDown className="size-4 shrink-0 text-ink-gray-9" />
                )}
              >
                <span
                  className={cn(
                    "truncate",
                    displayValue ? "text-ink-gray-9" : "text-ink-gray-5",
                  )}
                >
                  {displayValue || "Select designation"}
                </span>
              </Button>
            )}
          </Autocomplete>
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
            count={ALLOCATIONS_PAGE_SIZE}
          >
            <GanttGrid
              ref={ganttRef}
              variant="team"
              startDate={anchorDate}
              members={members}
              rowHeaderLabel="Members"
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
