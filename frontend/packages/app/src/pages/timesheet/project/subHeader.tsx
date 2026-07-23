/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Filter, TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import { useDebounce } from "@/hooks/useDebounce";
import { useProjectTimesheet } from "./context";
import { projectTimesheetFilters } from "../constants";

export function SubHeader() {
  const search = useProjectTimesheet(({ state }) => state.filters.search);
  const compositeFilters = useProjectTimesheet(
    ({ state }) => state.compositeFilters,
  );

  const handleSearchChange = useProjectTimesheet(
    ({ actions }) => actions.handleSearchChange,
  );
  const handleCompositeFilterChange = useProjectTimesheet(
    ({ actions }) => actions.handleCompositeFilterChange,
  );
  const handleClearAllFilters = useProjectTimesheet(
    ({ actions }) => actions.handleClearAllFilters,
  );

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== searchInput || debouncedSearch === search) {
      return;
    }

    handleSearchChange(debouncedSearch);
  }, [debouncedSearch, handleSearchChange, search, searchInput]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const externalFilterCount = search !== "" ? 1 : 0;

  return (
    <div className="flex flex-wrap gap-2 justify-between mb-3.5">
      <div className="flex gap-2">
        <TextInput
          placeholder="Search project"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <Filter
        fields={projectTimesheetFilters}
        value={compositeFilters}
        onChange={handleCompositeFilterChange}
        renderLinkValue={(props) => <FilterLinkValue {...props} />}
        externalFilterCount={externalFilterCount}
        onClearAll={() => {
          setSearchInput("");
          handleClearAllFilters();
        }}
      />
    </div>
  );
}
