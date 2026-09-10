/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import {
  Combobox,
  FormLabel,
  MultiSelect,
  Select,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useDoctypeLinkLookup } from "@/hooks/useDoctypeLinkLookup";
import { useUser } from "@/providers/user";
import { WEEK_DAYS } from "./constants";

type Option = { label: string; value: string };

export function SettingsLinkField({
  label,
  doctype,
  value,
  onChange,
  clearable = false,
}: {
  label: string;
  doctype: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  clearable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectedOption = useMemo(
    () => (value ? { label: value, value } : null),
    [value],
  );
  const { options, isLoading } = useDoctypeLinkLookup({
    doctype,
    shouldFetch: true,
    query,
    selectedOption,
  });

  return (
    <div>
      <FormLabel size="md" className="text-ink-gray-8!">
        {label}
      </FormLabel>
      <Combobox
        options={options}
        value={value ?? ""}
        loading={isLoading}
        searchValue={query}
        onSearchChange={setQuery}
        openOnFocus
        clearable={clearable}
        placeholder={`Select ${label}`}
        onChange={(val) => onChange(val ?? null)}
        className="mt-2"
      />
    </div>
  );
}

export function SettingsCurrencyField({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
}) {
  const currencies = useUser((s) => s.state.currencies);

  return (
    <div>
      <FormLabel size="md" className="text-ink-gray-8!">
        Default Currency
      </FormLabel>
      <Combobox
        options={currencies}
        value={value || null}
        clearable
        placeholder="Select Currency"
        onChange={(val) => onChange(val ?? null)}
        className="mt-2"
      />
    </div>
  );
}

export function SettingsMultiSelectField({
  label,
  doctype,
  value,
  onChange,
}: {
  label: string;
  doctype: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedOptions = useMemo(
    () => value.map((item) => ({ label: item, value: item })),
    [value],
  );
  const { options, isLoading } = useDoctypeLinkLookup({
    doctype,
    shouldFetch: true,
    query,
    selectedOption: selectedOptions,
  });

  return (
    <div>
      <FormLabel size="md" className="text-ink-gray-8!">
        {label}
      </FormLabel>
      <MultiSelect
        options={options}
        value={value}
        loading={isLoading}
        searchValue={query}
        onSearchChange={setQuery}
        placeholder={`Select ${label}`}
        onChange={onChange}
        triggerClassName="mt-2 w-full"
        positionerClassName="z-100"
      />
    </div>
  );
}

export function SettingsDaySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const options = useMemo<Option[]>(
    () => WEEK_DAYS.map((day) => ({ label: day, value: day })),
    [],
  );

  return (
    <div>
      <FormLabel size="md" className="text-ink-gray-8!">
        {label}
      </FormLabel>
      <Select
        options={options}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2"
      />
    </div>
  );
}
