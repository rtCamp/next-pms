/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Filter, TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import ApprovalStatusFilter from "@/components/filters/approvalStatusFilter";
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import { useDebounce } from "@/hooks/useDebounce";
import { usePersonalTimesheet } from "./context";
import { personalTimesheetFilters } from "../constants";

export function SubHeader() {
  const search = usePersonalTimesheet(({ state }) => state.filters.search);
  const approvalStatus = usePersonalTimesheet(
    ({ state }) => state.filters.approvalStatus,
  );
  const compositeFilters = usePersonalTimesheet(
    ({ state }) => state.compositeFilters,
  );

  const handleSearchChange = usePersonalTimesheet(
    ({ actions }) => actions.handleSearchChange,
  );
  const handleApprovalStatusChange = usePersonalTimesheet(
    ({ actions }) => actions.handleApprovalStatusChange,
  );
  const handleCompositeFilterChange = usePersonalTimesheet(
    ({ actions }) => actions.handleCompositeFilterChange,
  );
  const handleClearAllFilters = usePersonalTimesheet(
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

  const externalFilterCount =
    (search !== "" ? 1 : 0) + (approvalStatus ? 1 : 0);

  return (
    <div className="flex flex-wrap gap-2 justify-between mb-3.5">
      <div className="flex gap-2">
        <TextInput
          placeholder="Search tasks"
          className="w-68.5 shrink-0"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <ApprovalStatusFilter
          value={approvalStatus}
          onChange={handleApprovalStatusChange}
        />
      </div>
      <Filter
        align="end"
        fields={personalTimesheetFilters}
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
