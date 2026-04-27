/**
 * External dependencies.
 */
import { useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { GanttGrid, Spinner } from "@next-pms/design-system/components";
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
import { useUser } from "@/providers/user";
import { useAllocationsTeam } from "./context";
import { AllocationsTeamProvider } from "./provider";

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

function AllocationsTeamContent() {
  const searchInput = useAllocationsTeam(({ state }) => state.searchInput);
  const duration = useAllocationsTeam(({ state }) => state.duration);
  const weekCount = useAllocationsTeam(({ state }) => state.weekCount);
  const isLoading = useAllocationsTeam(({ state }) => state.isLoading);
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
  const handlePrevious = useAllocationsTeam(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsTeam(({ actions }) => actions.handleToday);
  const handleNext = useAllocationsTeam(({ actions }) => actions.handleNext);

  const { hasRoleAccess } = useUser(({ state }) => ({
    hasRoleAccess: state.hasRoleAccess,
  }));

  const isAllTime = duration === "all-time";

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <div className="w-full flex flex-wrap gap-2 justify-start px-5">
        <div className="flex flex-wrap gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search Members or designation"
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
              { label: "All time", value: "all-time" },
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
              aria-label="Previous week"
              disabled={isAllTime}
            />
            <Button
              variant="ghost"
              label="Today"
              onClick={handleToday}
              disabled={isAllTime}
            />
            <Button
              variant="ghost"
              icon={() => <ChevronRight size={16} />}
              onClick={handleNext}
              aria-label="Next week"
              disabled={isAllTime}
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
      <div className="relative overflow-auto no-scrollbar w-full h-[calc(100vh-112px)]">
        <GanttGrid
          className={cn("transition-opacity duration-150", {
            "opacity-50 pointer-events-none": isLoading,
          })}
          startDate={anchorDate}
          members={filteredMembers}
          weekCount={weekCount}
          hasRoleAccess={hasRoleAccess}
        />
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center cursor-wait pointer-events-auto">
            <Spinner />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AllocationsTeam() {
  return (
    <AllocationsTeamProvider>
      <AllocationsTeamContent />
    </AllocationsTeamProvider>
  );
}

export default AllocationsTeam;
