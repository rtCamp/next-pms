/**
 * External dependencies.
 */
import { Button, Select, TextInput, Filter } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { PHASE_OPTIONS, RAG_OPTIONS, STATUS_OPTIONS } from "./constants";
import {
  useProjectFilter,
  type ProjectStatus,
  type RagStatus,
} from "./context";
import { Phase } from "./types";
const noop = () => {};

export function ProjectListSubHeader() {
  const search = useProjectFilter((c) => c.state.filters.search);
  const ragStatus = useProjectFilter((c) => c.state.filters.ragStatus);
  const phase = useProjectFilter((c) => c.state.filters.phase);
  const status = useProjectFilter((c) => c.state.filters.status);
  const advanced = useProjectFilter((c) => c.state.filters.advanced);

  const setSearch = useProjectFilter((c) => c.actions.setSearch);
  const setRagStatus = useProjectFilter((c) => c.actions.setRagStatus);
  const setPhase = useProjectFilter((c) => c.actions.setPhase);
  const setStatus = useProjectFilter((c) => c.actions.setStatus);
  const setAdvanced = useProjectFilter((c) => c.actions.setAdvanced);

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
        <Button size="sm" icon={DotHorizontal} onClick={noop} />
      </div>
    </div>
  );
}
