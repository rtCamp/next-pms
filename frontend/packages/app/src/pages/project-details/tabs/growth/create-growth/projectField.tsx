/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useProjectLookup } from "@/hooks/useProjectLookup";
import { mergeClassNames as cn } from "@/lib/utils";
import { FORM_INPUT_CLASS } from "../constants";

interface ProjectFieldProps {
  enabled: boolean;
  client: string;
  value: string;
  onChange: (value: string) => void;
}

export function ProjectField({
  enabled,
  client,
  value,
  onChange,
}: ProjectFieldProps) {
  const [search, setSearch] = useState("");
  const { options, isLoading } = useProjectLookup({
    shouldFetch: enabled && Boolean(client),
    filters: [["customer", "=", client]],
    query: search,
    selectedOption: value ? { label: value, value } : null,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-base text-ink-gray-5">Project</label>
      <Combobox
        inputClassName={cn("h-8", FORM_INPUT_CLASS)}
        loading={isLoading}
        options={options}
        placeholder={client ? "No project" : "Select a client first"}
        searchValue={search}
        onSearchChange={setSearch}
        value={value || null}
        onChange={(val) => onChange((val as string | null) ?? "")}
        disabled={!client}
        openOnFocus
        clearable
        tooltipOnTruncate
      />
    </div>
  );
}
