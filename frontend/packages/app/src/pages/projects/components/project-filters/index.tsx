/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";
import { SortSelector } from "@next-pms/design-system/components";
import {
  Combobox,
  Select,
  TextInput,
  Filter,
  MultiSelect,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/providers/user";
import { useProjectFilters } from "./useProjectFilters";
import { PHASE_OPTIONS, RAG_OPTIONS, STATUS_OPTIONS } from "../../constants";
import { Phase, type ProjectStatus, type RagStatus } from "../../types";
import { useProjectViews } from "../../views";

export function ProjectFilters() {
  const {
    filters: { search, ragStatus, phase, status, advanced, currency },
    sort,
    setSearch,
    setRagStatus,
    setPhase,
    setStatus,
    setAdvanced,
    setSort,
    resetFilters,
    setCurrency,
  } = useProjectFilters();
  const currencies = useUser((s) => s.state.currencies);

  const externalFilterCount =
    (search !== "" ? 1 : 0) +
    (ragStatus.length > 0 ? 1 : 0) +
    (phase ? 1 : 0) +
    (status ? 1 : 0);

  const activeView = useProjectViews((state) => state.state.activeView);
  const isKanban = activeView?.type.toLowerCase() === "custom";

  const [searchInput, setSearchInput] = useState(search);
  const isUserInput = useRef(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (!isUserInput.current) return;
    if (debouncedSearch !== search) setSearch(debouncedSearch);
  }, [debouncedSearch, search, setSearch]);

  useEffect(() => {
    isUserInput.current = false;
    setSearchInput(search);
  }, [search]);

  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <div className="w-44 shrink-0">
          <TextInput
            className="w-full text-ink-gray-7"
            size="sm"
            placeholder="Search project"
            value={searchInput}
            onChange={(e) => {
              isUserInput.current = true;
              setSearchInput(e.target.value);
            }}
          />
        </div>
        <div className="w-44 shrink-0">
          <MultiSelect
            placeholder="RAG Status"
            options={RAG_OPTIONS}
            value={ragStatus}
            onChange={(v) => setRagStatus(v as RagStatus[])}
          />
        </div>
        <div className="w-28 shrink-0">
          <Combobox
            placeholder="Currency"
            value={currency || null}
            onChange={(v) => setCurrency(v || "")}
            options={currencies}
          />
        </div>
        <Select
          placeholder="Phases"
          placeholderClassName="text-ink-gray-7"
          className="w-full text-ink-gray-7"
          value={phase}
          onChange={(v) => setPhase((v || "") as Phase | "")}
          options={PHASE_OPTIONS}
        />
        <Select
          placeholder="Status"
          placeholderClassName="text-ink-gray-7"
          className="w-full text-ink-gray-7"
          value={status}
          onChange={(v) => setStatus((v || "") as ProjectStatus | "")}
          options={STATUS_OPTIONS}
        />
      </div>
      <div className="flex gap-2">
        {!isKanban && (
          <SortSelector
            sort={sort}
            onSortChange={setSort}
            fields={[
              { field: "project_name", label: "Project name" },
              { field: "custom_project_phase", label: "Phase" },
              { field: "cost_burn_percent", label: "Cost burn" },
              { field: "profit_margin", label: "Profit margin" },
              { field: "expected_start_date", label: "Expected Start Date" },
              { field: "custom_next_milestone", label: "Next milestone" },
              { field: "expected_end_date", label: "Expected End Date" },
              {
                field: "custom_project_manager_name",
                label: "Project manager",
              },
              {
                field: "custom_engineering_manager_name",
                label: "Lead engineer",
              },
              { field: "project_type", label: "Project type" },
              { field: "customer", label: "Client name" },
              { field: "contract_end_date", label: "Contract end date" },
              { label: "Last Updated On", field: "modified" },
            ]}
          />
        )}
        <Filter
          align="end"
          value={advanced}
          onChange={setAdvanced}
          renderLinkValue={(props) => <FilterLinkValue {...props} />}
          fields={[
            {
              name: "name",
              label: "Project",
              type: "link",
              link: { doctype: "Project", labelField: "project_name" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_project_manager",
              label: "Project Manager",
              type: "link",
              link: {
                doctype: "Employee",
                labelField: "employee_name",
                valueField: "user_id",
                customMethod: {
                  method: "next_pms.timesheet.api.employee.get_employee_list",
                  args: { roles: ["Projects Manager"] },
                },
              },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_business_unit",
              label: "Business Unit",
              type: "link",
              link: { doctype: "Business Unit" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "project_type",
              label: "Project Type",
              type: "link",
              link: { doctype: "Project Type" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_billing_type",
              label: "Billing type",
              type: "select",
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
              options: [
                { label: "Non-Billable", value: "Non-Billable" },
                { label: "Fixed Cost", value: "Fixed Cost" },
                { label: "Retainer", value: "Retainer" },
                { label: "Time and Material", value: "Time and Material" },
              ],
            },
            {
              name: "custom_industry",
              label: "Industry",
              type: "link",
              link: { doctype: "Industry Type" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "customer",
              label: "Customer",
              type: "link",
              link: { doctype: "Customer", labelField: "customer_name" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_engineering_manager",
              label: "Engineering Manager",
              type: "link",
              link: {
                doctype: "Employee",
                labelField: "employee_name",
                valueField: "user_id",
                customMethod: {
                  method: "next_pms.timesheet.api.employee.get_employee_list",
                },
              },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_account_manager_",
              label: "Account Manager",
              type: "link",
              link: {
                doctype: "Employee",
                labelField: "employee_name",
                valueField: "user_id",
                customMethod: {
                  method: "next_pms.timesheet.api.employee.get_employee_list",
                },
              },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_host",
              label: "Host",
              type: "link",
              link: { doctype: "Host" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
          ]}
          externalFilterCount={externalFilterCount}
          onClearAll={resetFilters}
        />
      </div>
    </div>
  );
}
