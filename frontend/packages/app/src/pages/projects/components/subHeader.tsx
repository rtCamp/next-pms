/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import { SortSelector } from "@next-pms/design-system/components";
import {
  Select,
  TextInput,
  Filter,
  MultiSelect,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { ROUTES } from "@/lib/constant";
import { PHASE_OPTIONS, RAG_OPTIONS, STATUS_OPTIONS } from "../constants";
import { useProjectFilters } from "../hooks/useProjectFilters";
import { Phase, type ProjectStatus, type RagStatus } from "../types";

export function ProjectListSubHeader() {
  const {
    filters: { search, ragStatus, phase, status, advanced },
    sort,
    setSearch,
    setRagStatus,
    setPhase,
    setStatus,
    setAdvanced,
    setSort,
  } = useProjectFilters();

  const isKanban = !!useMatch(ROUTES["project-kanban"]);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== search) setSearch(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <TextInput
          className="w-full text-ink-gray-7"
          size="sm"
          placeholder="Search project"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="w-44 shrink-0">
          <MultiSelect
            placeholder="RAG Status"
            options={RAG_OPTIONS}
            value={ragStatus}
            onChange={(v) => setRagStatus(v as RagStatus[])}
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
              //          { field: "burn_rate_per_week", label: "Burn rate/week" },
              //          { field: "cost_burn_percent", label: "Cost burn" },
              //          { field: "total_budget", label: "Total budget" },
              {
                field: "custom_percentage_estimated_profit",
                label: "Profit margin",
              },
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
              //          { field: "contract_end_date", label: "Contract end date" },

              { label: "Last Updated On", field: "modified" },
            ]}
          />
        )}
        <Filter
          align="end"
          value={advanced}
          onChange={setAdvanced}
          fields={[
            {
              name: "project_name",
              label: "Project",
              type: "string",
            },
            {
              name: "custom_project_manager",
              label: "Project Manager",
              type: "string",
            },
            {
              name: "custom_business_unit",
              label: "Business Unit",
              type: "string",
            },
            {
              name: "project_type",
              label: "Project Type",
              type: "select",
              options: [
                {
                  label: "Internal",
                  value: "internal",
                },
                {
                  label: "External",
                  value: "external",
                },
                {
                  label: "Other",
                  value: "other",
                },
              ],
            },
            {
              name: "custom_billing_type",
              label: "Billing type",
              type: "select",
              options: [
                {
                  label: "Non-Billable",
                  value: "Non-Billable",
                },
                {
                  label: "Fixed Cost",
                  value: "Fixed Cost",
                },
                {
                  label: "Retainer",
                  value: "Retainer",
                },
                {
                  label: "Time and Material",
                  value: "Time and Material",
                },
              ],
            },
            {
              name: "custom_industry",
              label: "Industry",
              type: "string",
            },
            {
              name: "customer",
              label: "Customer",
              type: "string",
            },
            {
              name: "custom_engineering_manager",
              label: "Engineering Manager",
              type: "string",
            },
            {
              name: "custom_account_manager",
              label: "Account Manger",
              type: "string",
            },
            {
              name: "custom_host",
              label: "Host",
              type: "string",
            },
          ]}
        />
      </div>
    </div>
  );
}
