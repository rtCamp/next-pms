/**
 * External dependencies.
 */
import { useEffect, useMemo } from "react";
import { Select } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { Field } from "./field";

interface ProjectBoardFieldProps {
  repository: string;
  value: string;
  onChange: (value: string) => void;
}

export function ProjectBoardField({
  repository,
  value,
  onChange,
}: ProjectBoardFieldProps) {
  const { data: projectBoards } = useFrappeGetCall<{ message: string[] }>(
    "next_pms.api.generate_pm_report.get_repository_project_boards",
    { repository },
    repository ? `get_repository_project_boards:${repository}` : null,
  );

  const options = useMemo(
    () =>
      (projectBoards?.message ?? []).map((board) => ({
        label: board,
        value: board,
      })),
    [projectBoards],
  );

  useEffect(() => {
    if (options.length === 0) {
      onChange("");
      return;
    }

    // Auto-select first board if value is empty or no longer in options
    if (!value || !options.some((opt) => opt.value === value)) {
      onChange(options[0].value);
    }
  }, [options, value, onChange]);

  return (
    <Field label="Project Board" className="col-span-2">
      <Select
        variant="outline"
        className="text-ink-gray-7"
        value={value}
        onChange={(selected) => onChange(selected ?? "")}
        options={options}
        disabled={options.length === 0}
        placeholder="Select project board…"
      />
    </Field>
  );
}
