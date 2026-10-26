import type { EmployeeLookupOption } from "@/composables/useEmployeeLookup";
import {
  MANAGE_ALL_ROLES,
  OWNER_GATED_ROLES,
  UPDATE_ADMIN_ROLE,
} from "./constants";
import type { OwnerGatedPermissions, Person, UserDetails } from "./types";

/**
 * What the session may do with an owner-gated record (a risk, a growth initiative):
 * manage-all roles edit and delete any; an owner-gated role edits only its own.
 */
export function ownerGatedPermissions(
  roles: readonly string[],
  userId: string,
  ownerId?: string | null,
): OwnerGatedPermissions {
  const managesAll = MANAGE_ALL_ROLES.some((role) => roles.includes(role));
  const isOwner =
    OWNER_GATED_ROLES.some((role) => roles.includes(role)) &&
    ownerId?.toLowerCase() === userId.toLowerCase();
  return { canEdit: managesAll || isOwner, canDelete: managesAll };
}

/** Whether the session may edit or delete an update: its author, or a System Manager, on a record it may edit. */
export function canManageUpdate(
  canEditRecord: boolean,
  roles: readonly string[],
  userId: string,
  updatedBy?: string | null,
): boolean {
  return (
    canEditRecord && (roles.includes(UPDATE_ADMIN_ROLE) || updatedBy === userId)
  );
}

/** A user as shown on a record, falling back to the user ID when their details are missing. */
export function toPerson(userId: string, details?: UserDetails | null): Person {
  return {
    userId,
    label: details?.full_name || userId,
    image: details?.user_image ?? undefined,
  };
}

/**
 * Employee options keyed by their user, for pickers whose value is a User: employees
 * without one are left out, and the current user is kept as the first option when the
 * results don't include it.
 */
export function toEmployeeUserOptions(
  options: readonly EmployeeLookupOption[],
  current?: Person | null,
): EmployeeLookupOption[] {
  const mapped = options
    .filter((option) => option.userId)
    .map((option) => ({ ...option, value: option.userId as string }));
  if (current && !mapped.some((option) => option.value === current.userId)) {
    mapped.unshift({
      label: current.label,
      value: current.userId,
      image: current.image,
      userId: current.userId,
    });
  }
  return mapped;
}
