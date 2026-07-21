/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import { SortSelector } from "@next-pms/design-system/components";
import {
  Combobox,
  Filter,
  MultiSelect,
  TextInput,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import { useDebounce } from "@/hooks/useDebounce";
import { useDoctypeLinkLookup } from "@/hooks/useDoctypeLinkLookup";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_SORTABLE_FIELDS,
  TASK_STATUS_OPTIONS,
} from "../constants";
import type { TaskStatus } from "../types";
import { useTaskFilters } from "../useTaskFilters";

export function TaskListSubHeader() {
  const {
    filters: { search, project, status, advanced },
    sort,
    setSearch,
    setProject,
    setStatus,
    setAdvanced,
    setSort,
  } = useTaskFilters();

  const externalFilterCount =
    (search !== "" ? 1 : 0) +
    (project !== "" ? 1 : 0) +
    (status.length > 0 ? 1 : 0);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== searchInput || debouncedSearch === search) {
      return;
    }

    setSearch(debouncedSearch);
  }, [debouncedSearch, searchInput, search, setSearch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const [projectQuery, setProjectQuery] = useState("");
  const selectedProjectOption = useMemo(
    () => (project ? { label: project, value: project } : null),
    [project],
  );
  const { options: projectOptions, isLoading: isProjectLoading } =
    useDoctypeLinkLookup({
      doctype: "Project",
      labelField: "project_name",
      shouldFetch: true,
      query: projectQuery,
      selectedOption: selectedProjectOption,
    });

  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <div className="w-44 shrink-0">
          <TextInput
            className="w-full text-ink-gray-7"
            size="sm"
            placeholder="Search task"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-44 shrink-0">
          <Combobox
            options={projectOptions}
            value={project}
            loading={isProjectLoading}
            searchValue={projectQuery}
            onSearchChange={setProjectQuery}
            openOnFocus
            placeholder="Project"
            onChange={(val) => setProject(val ?? "")}
            className="w-full"
          />
        </div>
        <div className="w-44 shrink-0">
          <MultiSelect
            placeholder="Status"
            options={TASK_STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as TaskStatus[])}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <SortSelector
          sort={sort.field ? sort : null}
          onSortChange={setSort}
          fields={TASK_SORTABLE_FIELDS.map(({ field, label }) => ({
            field,
            label,
          }))}
        />
        <Filter
          align="end"
          value={advanced}
          onChange={setAdvanced}
          renderLinkValue={(props) => <FilterLinkValue {...props} />}
          fields={[
            {
              name: "priority",
              label: "Priority",
              type: "select",
              options: TASK_PRIORITY_OPTIONS,
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "type",
              label: "Task Type",
              type: "link",
              link: { doctype: "Task Type" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "department",
              label: "Department",
              type: "link",
              link: { doctype: "Department" },
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
            {
              name: "custom_is_billable",
              label: "Is Billable",
              type: "select",
              options: [
                { label: "Yes", value: "1" },
                { label: "No", value: "0" },
              ],
              operators: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
              ],
            },
          ]}
          externalFilterCount={externalFilterCount}
          onClearAll={() => {
            setSearchInput("");
            setSearch("");
            setProject("");
            setStatus([]);
          }}
        />
      </div>
    </div>
  );
}
