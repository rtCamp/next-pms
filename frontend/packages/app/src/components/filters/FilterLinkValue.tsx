/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import {
  Combobox,
  type FilterLinkValueRenderProps,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useDoctypeLinkLookup } from "@/hooks/useDoctypeLinkLookup";

/**
 * Value-cell renderer for `type: "link"` filter fields.
 */
export const FilterLinkValue: React.FC<FilterLinkValueRenderProps> = ({
  field,
  value,
  displayLabel,
  onChange,
  disabled,
}) => {
  const linkConfig = field.link;
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => (value ? { label: displayLabel ?? value, value } : null),
    [value, displayLabel],
  );

  const { options, isLoading } = useDoctypeLinkLookup({
    doctype: linkConfig?.doctype ?? "",
    labelField: linkConfig?.labelField,
    valueField: linkConfig?.valueField,
    filters: linkConfig?.filters,
    customMethod: linkConfig?.customMethod,
    shouldFetch: Boolean(linkConfig?.doctype),
    query,
    selectedOption,
  });

  return (
    <Combobox
      options={options}
      value={value}
      loading={isLoading}
      searchValue={query}
      onSearchChange={setQuery}
      openOnFocus
      disabled={disabled}
      placeholder="Value"
      onChange={(val, option) => {
        const label =
          option && typeof option !== "string" ? option.label : undefined;
        onChange(val, label);
      }}
      className="w-50"
    />
  );
};

export default FilterLinkValue;
