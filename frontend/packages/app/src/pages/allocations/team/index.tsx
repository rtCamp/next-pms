/**
 * Internal dependencies.
 */
import { useState } from "react";
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
import { FAKE_MEMBERS, GANTT_START_DATE } from "./constants";

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

const DURATION_WEEK_COUNT: Record<string, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
  "all-time": 100,
};

function AllocationsTeam() {
  const [search, setSearch] = useState("");
  const [allocationsType, setAllocationsType] = useState<string | undefined>();
  const [duration, setDuration] = useState<string>("this-month");
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );

  const weekCount = DURATION_WEEK_COUNT[duration];

  const filteredMembers = search.trim()
    ? FAKE_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.role?.toLowerCase().includes(search.toLowerCase()),
      )
    : FAKE_MEMBERS;

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
        <div className="flex gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search Members or designation"
            debounce={200}
            onChange={(e) => setSearch(e.target.value)}
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
      </div>
      <GanttGrid
        key={weekCount + search}
        startDate={GANTT_START_DATE}
        members={filteredMembers}
        weekCount={weekCount}
      />
    </>
  );
}

export default AllocationsTeam;
