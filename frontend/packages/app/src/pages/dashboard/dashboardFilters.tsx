/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  ALL_CLIENTS_VALUE,
  ALL_PROJECTS_VALUE,
  MOCK_CLIENT_OPTIONS,
  MOCK_PROJECT_OPTIONS,
} from "./constants";

export function DashboardFilters() {
  const [client, setClient] = useState<string>(ALL_CLIENTS_VALUE);
  const [project, setProject] = useState<string>(ALL_PROJECTS_VALUE);

  const inputClassName =
    "h-fit rounded-lg border-outline-gray-1 bg-white px-2 py-1.5 text-sm text-ink-gray-7";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Combobox
        className="w-40"
        inputClassName={inputClassName}
        options={MOCK_CLIENT_OPTIONS}
        value={client}
        onChange={(value) => setClient(value ?? ALL_CLIENTS_VALUE)}
      />
      <Combobox
        className="w-40"
        inputClassName={inputClassName}
        options={MOCK_PROJECT_OPTIONS}
        value={project}
        onChange={(value) => setProject(value ?? ALL_PROJECTS_VALUE)}
      />
    </div>
  );
}
