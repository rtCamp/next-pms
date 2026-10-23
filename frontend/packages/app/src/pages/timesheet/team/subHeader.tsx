/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { InfoHoverCard } from "@next-pms/design-system/components";
import { Filter, TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import ApprovalStatusFilter from "@/components/filters/approvalStatusFilter";
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import ReportsToFilter from "@/components/filters/reportsToFilter";
import { useDebounce } from "@/hooks/useDebounce";
import { useTeamTimesheet } from "./context";
import { TEAM_TIMESHEET_HELP } from "./help";
import { teamTimesheetFilters } from "../constants";

export function SubHeader() {
  const search = useTeamTimesheet(({ state }) => state.filters.search);
  const approvalStatus = useTeamTimesheet(
    ({ state }) => state.filters.approvalStatus,
  );
  const reportsTo = useTeamTimesheet(({ state }) => state.filters.reportsTo);
  const compositeFilters = useTeamTimesheet(
    ({ state }) => state.compositeFilters,
  );

  const handleSearchChange = useTeamTimesheet(
    ({ actions }) => actions.handleSearchChange,
  );
  const handleApprovalStatusChange = useTeamTimesheet(
    ({ actions }) => actions.handleApprovalStatusChange,
  );
  const handleReportsToChange = useTeamTimesheet(
    ({ actions }) => actions.handleReportsToChange,
  );
  const handleCompositeFilterChange = useTeamTimesheet(
    ({ actions }) => actions.handleCompositeFilterChange,
  );
  const handleClearAllFilters = useTeamTimesheet(
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
    (search !== "" ? 1 : 0) +
    (approvalStatus?.length ? 1 : 0) +
    (reportsTo ? 1 : 0);

  return (
    <div className="flex flex-wrap gap-2 justify-between mb-3.5">
      <div className="flex gap-2">
        <TextInput
          placeholder="Search members"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          <ReportsToFilter value={reportsTo} onChange={handleReportsToChange} />
          <InfoHoverCard help={TEAM_TIMESHEET_HELP.reportsTo} />
        </div>
        <ApprovalStatusFilter
          value={approvalStatus}
          onChange={handleApprovalStatusChange}
        />
      </div>
      <Filter
        align="end"
        fields={teamTimesheetFilters}
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
