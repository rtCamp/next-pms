/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox, ErrorMessage, FormLabel } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useCustomerLookup } from "@/hooks/useCustomerLookup";
import { mergeClassNames as cn } from "@/lib/utils";
import { FORM_INPUT_CLASS } from "../constants";

interface ClientFieldProps {
  enabled: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function ClientField({
  enabled,
  value,
  error,
  onChange,
}: ClientFieldProps) {
  const [search, setSearch] = useState("");
  const { options, isLoading } = useCustomerLookup({
    shouldFetch: enabled,
    query: search,
    selectedOption: value ? { label: value, value } : null,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel size="md" required>
        Client
      </FormLabel>
      <Combobox
        inputClassName={cn("h-8", FORM_INPUT_CLASS)}
        loading={isLoading}
        options={options}
        placeholder="Select client"
        searchValue={search}
        onSearchChange={setSearch}
        value={value || null}
        onChange={(val) => onChange((val as string | null) ?? "")}
        openOnFocus
        tooltipOnTruncate
      />
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
