/**
 * External dependencies.
 */
import { useState } from "react";
import { GanttGrid } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { Button, Filter, Select, TextInput } from "@rtcamp/frappe-ui-react";
import {
  DotHorizontal,
  SmallLeftChevron,
  SmallRightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { isWeekendEntryAllowed } from "@/lib/utils";
import {
  allocationsFilters,
  allocationsTypeOptions,
  durationOptions,
  navigationButtonAriaLabels,
} from "../constants";
import type { AllocationsDuration } from "../types";
import {
  getProjectAllocationShellStartDate,
  getProjectAllocationWeekCount,
  moveProjectAllocationShellDate,
  projectAllocationShellProjects,
} from "./fakeData";

export const AllocationsProjectTable = () => {
  const [searchInput, setSearch] = useState("");
  const [duration, setDuration] = useState<AllocationsDuration>("this-quarter");
  const [allocationsType, setAllocationsType] = useState("all");
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [anchorDate, setAnchorDate] = useState(() =>
    getProjectAllocationShellStartDate(),
  );

  const weekCount = getProjectAllocationWeekCount(duration);
  const showWeekend = isWeekendEntryAllowed();

  const handlePrevious = () => {
    setAnchorDate((currentDate) =>
      moveProjectAllocationShellDate(currentDate, duration, "previous"),
    );
  };

  const handleToday = () => {
    setAnchorDate(getProjectAllocationShellStartDate());
  };

  const handleNext = () => {
    setAnchorDate((currentDate) =>
      moveProjectAllocationShellDate(currentDate, duration, "next"),
    );
  };

  return (
    <div className="flex flex-wrap gap-3.5 justify-between py-3.5">
      <div className="w-full flex flex-wrap gap-2 justify-between px-5">
        <div className="flex flex-wrap gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search project or member"
            onChange={(e) => setSearch(e.target.value)}
            value={searchInput}
          />
          <Select
            placeholder="Duration"
            className="w-fit"
            options={durationOptions}
            value={duration}
            onChange={(value) =>
              setDuration((value || "this-quarter") as AllocationsDuration)
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
              aria-label={navigationButtonAriaLabels.previous[duration]}
            />
            <Button variant="ghost" label="Today" onClick={handleToday} />
            <Button
              variant="ghost"
              icon={() => (
                <SmallRightChevron className="size-4 text-ink-gray-9" />
              )}
              onClick={handleNext}
              aria-label={navigationButtonAriaLabels.next[duration]}
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
      <div className="relative w-full h-[calc(100vh-112px)] overflow-auto no-scrollbar">
        <GanttGrid
          variant="project"
          startDate={anchorDate}
          projects={projectAllocationShellProjects}
          weekCount={weekCount}
          showWeekend={showWeekend}
          rowHeaderLabel="Projects"
        />
      </div>
    </div>
  );
};
