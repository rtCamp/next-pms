/**
 * External dependencies.
 */

/**
 * Internal dependencies.
 */
import { useState } from "react";
import {
  Avatar,
  Button,
  Combobox,
  Filter,
  FilterCondition,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Ellipsis } from "lucide-react";
import { EmployeeRecord } from "../components/submit-approval/types";
import { sampleFields } from "../constants";

function TimesheetTeamPage() {
  const [search, setSearch] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { data: approversData } = useFrappeGetCall(
    "next_pms.timesheet.api.get_employee_list",
    {
      role: ["Projects Manager", "Projects User"],
    },
  );

  const approvers = ((approversData?.message ?? []) as EmployeeRecord[]).map(
    (emp) => ({
      label: emp.employee_name,
      value: emp.name,
      icon: <Avatar image={emp.image} label={emp.employee_name} />,
    }),
  );

  return (
    <div className="w-full h-full py-3.5 px-3">
      <div className="flex justify-between mb-3.5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Search Tasks"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />

          <Combobox
            value={reportsTo}
            placeholder="Reports To"
            onChange={(val) => setReportsTo(val ?? "")}
            options={approvers}
            inputClassName="h-7"
          />

          <Select
            placeholder="Approval Status"
            className="w-fit"
            options={[
              {
                label: "Not Submitted",
                value: "not-submitted",
              },
              {
                label: "Approval Pending",
                value: "approval-pending",
              },
              {
                label: "Approved",
                value: "approved",
              },
              {
                label: "Rejected",
                value: "rejected",
              },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Filter
            fields={sampleFields}
            value={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
            }}
          />
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>
    </div>
  );
}

export default TimesheetTeamPage;
