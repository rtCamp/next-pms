interface Role {
  designation: string;
}

export function roleOptions(roles: Role[]) {
  return roles.map((role) => ({
    value: role.designation,
    label: role.designation,
  }));
}

/** The selected roles, or every role when none is selected. */
export function filterBySelected<T extends Role>(
  roles: T[],
  selected: string[],
): T[] {
  return selected.length
    ? roles.filter((role) => selected.includes(role.designation))
    : roles;
}
