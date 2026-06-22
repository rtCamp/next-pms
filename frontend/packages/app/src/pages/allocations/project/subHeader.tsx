/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Button,
  Filter,
  MultiSelect,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import {
  SmallLeftChevron,
  SmallRightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { useGuardedAction } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useUser } from "@/providers/user";
import { durationOptions, navigationButtonAriaLabels } from "../constants";
import {
  projectAllocationFilters,
  projectAllocationsTypeOptions,
} from "./constants";
import { useAllocationsProject } from "./context";

export function SubHeader() {
  const search = useAllocationsProject(({ state }) => state.search);
  const duration = useAllocationsProject(({ state }) => state.duration);
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
  const handlePrevious = useAllocationsProject(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsProject(
    ({ actions }) => actions.handleToday,
  );
  const handleNext = useAllocationsProject(({ actions }) => actions.handleNext);

  const guard = useGuardedAction();
  const roles = useUser(({ state }) => state.roles);
  const showFilters =
    roles.includes("Projects Manager") || roles.includes("Projects User");

  const [searchInput, setSearchInput] = useState(search);
  const [isAllocationTypeOpen, setIsAllocationTypeOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== searchInput || debouncedSearch === search) {
      return;
    }

    setSearch(debouncedSearch);
  }, [debouncedSearch, searchInput, search, setSearch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <div className="w-full flex flex-wrap gap-2 justify-between px-5">
      <div className="flex flex-wrap gap-2">
        <TextInput
          placeholder="Search project"
          onChange={(e) => guard(() => setSearchInput(e.target.value))}
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
        {showFilters ? (
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
            icon={() => <SmallLeftChevron className="size-4 text-ink-gray-8" />}
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
              <SmallRightChevron className="size-4 text-ink-gray-8" />
            )}
            onClick={() => guard(handleNext)}
            aria-label={navigationButtonAriaLabels["next"][duration]}
          />
        </div>
        {showFilters ? (
          <Filter
            align="end"
            fields={projectAllocationFilters}
            value={compositeFilters}
            onChange={(value) => guard(() => setCompositeFilters(value))}
          />
        ) : null}
      </div>
    </div>
  );
}
