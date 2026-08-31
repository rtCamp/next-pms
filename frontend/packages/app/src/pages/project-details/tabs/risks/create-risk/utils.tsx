/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { EmployeeLookupOption } from "@/hooks/useEmployeeLookup";

export function toRiskOwnerOptions(
  options: EmployeeLookupOption[],
  userId?: string,
  name?: string,
) {
  const mapped = options
    .filter((option) => option.userId)
    .map((option) => ({
      label: option.label,
      value: option.userId!,
      icon: (
        <Avatar
          size="xs"
          shape="circle"
          image={option.image}
          label={option.label}
        />
      ),
    }));

  if (userId && !mapped.some((option) => option.value === userId)) {
    mapped.unshift({
      label: name ?? userId,
      value: userId,
      icon: <Avatar size="xs" shape="circle" label={name ?? userId} />,
    });
  }

  return mapped;
}
