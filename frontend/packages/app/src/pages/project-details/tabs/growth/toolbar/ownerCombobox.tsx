/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Avatar, Combobox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserDetailsMap } from "../types";

interface OwnerComboboxProps {
  placeholder: string;
  owners: UserDetailsMap;
  value: string;
  onChange: (value: string) => void;
}

export function OwnerCombobox({
  placeholder,
  owners,
  value,
  onChange,
}: OwnerComboboxProps) {
  const options = useMemo(
    () =>
      Object.entries(owners).map(([email, details]) => {
        const label = details?.full_name ?? email;
        return {
          label,
          value: email,
          icon: (
            <Avatar
              size="xs"
              shape="circle"
              image={details?.user_image ?? undefined}
              label={label}
            />
          ),
        };
      }),
    [owners],
  );

  return (
    <Combobox
      className="w-44"
      inputClassName="h-7 text-ink-gray-7"
      placeholder={placeholder}
      options={options}
      value={value || null}
      onChange={(val) => onChange((val as string | null) ?? "")}
      openOnFocus
      clearable
    />
  );
}
