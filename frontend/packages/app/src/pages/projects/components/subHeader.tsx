/**
 * External dependencies.
 */
import { Select, TextInput, Filter } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
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

  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <TextInput
          size="sm"
          placeholder="Search project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          placeholder="RAG Status"
          className="w-fit"
          value={ragStatus}
          onChange={(v) => setRagStatus((v || "") as RagStatus | "")}
          options={RAG_OPTIONS}
        />
        <Select
          placeholder="Phases"
          className="w-fit"
          value={phase}
          onChange={(v) => setPhase((v || "") as Phase | "")}
          options={PHASE_OPTIONS}
        />
        <Select
          placeholder="Status"
          className="w-fit"
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
