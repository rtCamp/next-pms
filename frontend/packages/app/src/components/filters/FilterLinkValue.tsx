/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { Combobox, type FilterLinkValueRenderProps } from "@rtcamp/frappe-ui-react";

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
  onChange,
  disabled,
}) => {
  const linkConfig = field.link;
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => (value ? { label: value, value } : null),
    [value],
  );

  const { options, isLoading } = useDoctypeLinkLookup({
    doctype: linkConfig?.doctype ?? "",
    labelField: linkConfig?.labelField,
    valueField: linkConfig?.valueField,
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
      onChange={(val) => onChange(val)}
      className="w-auto"
    />
  );
};

export default FilterLinkValue;