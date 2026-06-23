/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Select, TextInput, Filter } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { PHASE_OPTIONS, RAG_OPTIONS, STATUS_OPTIONS } from "../constants";
import { useProjectFilters } from "../hooks/useProjectFilters";
import { Phase, type ProjectStatus, type RagStatus } from "../types";

export function ProjectListSubHeader() {
  const {
    filters: { search, ragStatus, phase, status, advanced },
    setSearch,
    setRagStatus,
    setPhase,
    setStatus,
    setAdvanced,
  } = useProjectFilters();

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
          className="text-ink-gray-7"
          size="sm"
          placeholder="Search project"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          placeholder="RAG Status"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={ragStatus}
          onChange={(v) => setRagStatus((v || "") as RagStatus | "")}
          options={RAG_OPTIONS}
        />
        <Select
          placeholder="Phases"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={phase}
          onChange={(v) => setPhase((v || "") as Phase | "")}
          options={PHASE_OPTIONS}
        />
        <Select
          placeholder="Status"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={status}
          onChange={(v) => setStatus((v || "") as ProjectStatus | "")}
          options={STATUS_OPTIONS}
        />
      </div>
      <div className="flex gap-2">
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
          ]}
        />
      </div>
    </div>
  );
}
