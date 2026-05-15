/**
 * External dependencies.
 */
import { useState } from "react";
import { Typography } from "@next-pms/design-system/components";
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
import {
  allocationsFilters,
  allocationsTypeOptions,
  durationOptions,
  navigationButtonAriaLabels,
} from "../constants";
import { AllocationsDuration } from "../types";

export const AllocationsProjectTable = () => {
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );

  const [searchInput, setSearch] = useState("");
  const [duration, setDuration] = useState<AllocationsDuration>("this-quarter");
  const [allocationsType, setAllocationsType] = useState("all");
  const handlePrevious = () => {};
  const handleToday = () => {};
  const handleNext = () => {};

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
            icon={() => <DotHorizontal className="size-4 text-ink-gray-9" />}
          />
        </div>
      </div>
      <div className="relative w-full h-[calc(100vh-112px)] overflow-auto no-scrollbar">
        <Typography className="flex h-full items-center justify-center">
          No Data
        </Typography>
      </div>
    </div>
  );
};
