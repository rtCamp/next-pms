/**
 * External dependencies.
 */
import { useProjectPhase } from "@next-pms/hooks";
import { Button, Select, TextInput, Filter } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useProjectList, type ProjectStatus, type RagStatus } from "./context";
import type { Phase } from "./types";

const noop = () => {};

const RAG_OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Amber", value: "amber" },
  { label: "Green", value: "green" },
];

const STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

export function ProjectListSubHeader() {
  const { phases } = useProjectPhase();

  const search = useProjectList((c) => c.state.filters.search);
  const ragStatus = useProjectList((c) => c.state.filters.ragStatus);
  const phase = useProjectList((c) => c.state.filters.phase);
  const status = useProjectList((c) => c.state.filters.status);
  const advanced = useProjectList((c) => c.state.filters.advanced);

  const setSearch = useProjectList((c) => c.actions.setSearch);
  const setRagStatus = useProjectList((c) => c.actions.setRagStatus);
  const setPhase = useProjectList((c) => c.actions.setPhase);
  const setStatus = useProjectList((c) => c.actions.setStatus);
  const setAdvanced = useProjectList((c) => c.actions.setAdvanced);

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
          onChange={(v) => setRagStatus(v as RagStatus | undefined)}
          options={RAG_OPTIONS}
        />
        <Select
          placeholder="Phases"
          className="w-fit"
          value={phase}
          onChange={(v) => setPhase(v as Phase | undefined)}
          options={phases.map((p) => ({ label: p, value: p }))}
        />
        <Select
          placeholder="Status"
          className="w-fit"
          value={status}
          onChange={(v) => setStatus(v as ProjectStatus | undefined)}
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
