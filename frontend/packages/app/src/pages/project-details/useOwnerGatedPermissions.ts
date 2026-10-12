/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { useUser } from "@/providers/user";
import { MANAGE_ALL_ROLES, OWNER_GATED_ROLES } from "./constants";

export function useOwnerGatedPermissions(owner?: string | null) {
  const { roles, userId } = useUser(({ state }) => ({
    roles: state.roles,
    userId: state.userId,
  }));

  return useMemo(() => {
    const hasUnrestrictedRole = MANAGE_ALL_ROLES.some((role) =>
      roles.includes(role),
    );
    const hasOwnerGatedRole = OWNER_GATED_ROLES.some((role) =>
      roles.includes(role),
    );
    const isOwner =
      hasOwnerGatedRole && owner?.toLowerCase() === userId.toLowerCase();

    return {
      canEdit: hasUnrestrictedRole || isOwner,
      canDelete: hasUnrestrictedRole,
    };
  }, [roles, userId, owner]);
}
