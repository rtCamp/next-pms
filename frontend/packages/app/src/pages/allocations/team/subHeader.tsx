/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Autocomplete,
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
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { useDesignationLookup } from "@/hooks/useDesignationLookup";
import { useGuardedAction } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useUser } from "@/providers/user";
import { durationOptions, navigationButtonAriaLabels } from "../constants";
import { teamAllocationFilters, teamAllocationsTypeOptions } from "./constants";
import { useAllocationsTeam } from "./context";

export function SubHeader() {
  const search = useAllocationsTeam(({ state }) => state.search);
  const duration = useAllocationsTeam(({ state }) => state.duration);
  const designation = useAllocationsTeam(({ state }) => state.designation);
  const allocationsType = useAllocationsTeam(
    ({ state }) => state.allocationsType,
  );
  const compositeFilters = useAllocationsTeam(
    ({ state }) => state.compositeFilters,
  );

  const setSearch = useAllocationsTeam(({ actions }) => actions.setSearch);
  const setDuration = useAllocationsTeam(({ actions }) => actions.setDuration);
  const setDesignation = useAllocationsTeam(
    ({ actions }) => actions.setDesignation,
  );
  const setAllocationsType = useAllocationsTeam(
    ({ actions }) => actions.setAllocationsType,
  );
  const setCompositeFilters = useAllocationsTeam(
    ({ actions }) => actions.setCompositeFilters,
  );
  const handlePrevious = useAllocationsTeam(
    ({ actions }) => actions.handlePrevious,
  );
  const handleToday = useAllocationsTeam(({ actions }) => actions.handleToday);
  const handleNext = useAllocationsTeam(({ actions }) => actions.handleNext);

  const guard = useGuardedAction();
  const { roles, hasBuField } = useUser(({ state }) => ({
    roles: state.roles,
    hasBuField: state.hasBuField,
  }));
  const showFilters =
    roles.includes("Projects Manager") || roles.includes("Projects User");

  const [searchInput, setSearchInput] = useState(search);
  const [designationQuery, setDesignationQuery] = useState("");
  const [isDesignationOpen, setIsDesignationOpen] = useState(false);
  const [isAllocationTypeOpen, setIsAllocationTypeOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { options: designationOptions, isLoading: isDesignationLookupLoading } =
    useDesignationLookup({
      shouldFetch: true,
      query: designationQuery,
    });

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
    <div className="flex flex-wrap justify-between w-full gap-2 px-5">
      <div className="flex flex-wrap gap-2">
        <TextInput
          variant="subtle"
          className="text-ink-gray-7 placeholder:text-ink-gray-4"
          placeholder="Search members"
          onChange={(e) => guard(() => setSearchInput(e.target.value))}
          value={searchInput}
        />
        {showFilters ? (
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
            keepSelectedVisible
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
                  <ChevronDown className="size-4 shrink-0 text-ink-gray-8" />
                )}
              >
                <span className="truncate text-ink-gray-7">
                  {displayValue || "Select designation"}
                </span>
              </Button>
            )}
          </Autocomplete>
        ) : null}
        <Select
          placeholder="Duration"
          className="w-fit text-ink-gray-7"
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
              options={teamAllocationsTypeOptions}
              value={allocationsType}
              placeholder="Allocation type"
              triggerClassName="text-ink-gray-7"
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
            fields={teamAllocationFilters.filter(
              (filter) => hasBuField || filter.name !== "business_unit",
            )}
            value={compositeFilters}
            onChange={(value) => guard(() => setCompositeFilters(value))}
            triggerClassName="text-ink-gray-7"
          />
        ) : null}
      </div>
    </div>
  );
}
