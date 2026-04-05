/**
 * Internal dependencies.
 */
import { useState } from "react";
import {
  Button,
  Filter,
  FilterCondition,
  FilterField,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";
import { UnderConstruction } from "@/components/under-construction";

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
  const [allocationsType, setAllocationsType] = useState<string | undefined>();
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
        <div className="flex gap-2">
          <TextInput
            className="w-xs"
            placeholder="Search Members or designation"
            debounce={200}
            onChange={(e) => console.log(e.target.value)}
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
            value={allocationsType}
            onChange={(value) => setAllocationsType(value)}
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
      <UnderConstruction />
    </>
  );
}

export default AllocationsTeam;
