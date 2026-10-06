/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import { mergeClassNames as cn } from "@/lib/utils";
import { toEmployeeUserOptions } from "@/pages/project-details/utils";
import { FORM_INPUT_CLASS } from "../constants";

interface EmployeeFieldProps {
  label: string;
  placeholder: string;
  enabled: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function EmployeeField({
  label,
  placeholder,
  enabled,
  value,
  onChange,
}: EmployeeFieldProps) {
  const [search, setSearch] = useState("");
  const { options, isLoading } = useEmployeeLookup({
    shouldFetch: enabled,
    pageSize: 100,
    query: search,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-base text-ink-gray-5">{label}</label>
      <Combobox
        inputClassName={cn("h-8", FORM_INPUT_CLASS)}
        loading={isLoading}
        options={toEmployeeUserOptions(options, value || undefined)}
        placeholder={placeholder}
        searchValue={search}
        onSearchChange={setSearch}
        value={value || null}
        onChange={(val) => onChange((val as string | null) ?? "")}
        openOnFocus
        clearable
      />
    </div>
  );
}
