/**
 * Internal dependencies.
 */
import { useEffect } from "react";
import { GanttGrid } from "@next-pms/design-system/components";
import {
  Button,
  Filter,
  FilterCondition,
  FilterField,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";
import { GANTT_START_DATE } from "./constants";
import { useAllocationsTeamShallow } from "./store";

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

function AllocationsTeam() {
  const {
    search,
    setSearch,
    allocationsType,
    setAllocationsType,
    duration,
    setDuration,
    compositeFilters,
    setCompositeFilters,
    weekCount,
    filteredMembers,
    isLoading,
    fetchData,
  } = useAllocationsTeamShallow((s) => ({
    search: s.search,
    setSearch: s.setSearch,
    allocationsType: s.allocationsType,
    setAllocationsType: s.setAllocationsType,
    duration: s.duration,
    setDuration: s.setDuration,
    compositeFilters: s.compositeFilters,
    setCompositeFilters: s.setCompositeFilters,
    weekCount: s.weekCount,
    filteredMembers: s.filteredMembers,
    isLoading: s.isLoading,
    fetchData: s.fetchData,
  }));

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <TextInput
          className="w-xs"
          placeholder="Search Members or designation"
          debounce={200}
          onChange={(e) => setSearch(e.target.value)}
          value={search}
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
          onChange={(value) => setDuration(value || "this-month")}
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
          onChange={(value) => setAllocationsType(value)}
        />
      </div>
      <div className="flex gap-2">
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
      <GanttGrid
        key={weekCount + search}
        startDate={GANTT_START_DATE}
        members={filteredMembers}
        weekCount={weekCount}
      />
    </div>
  );
}

export default AllocationsTeam;
