/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { useUser } from "@/providers/user";
import { MANAGE_ALL_RISK_ROLES, RISK_OWNER_GATED_ROLES } from "./constants";

export function useRiskPermissions(riskOwner?: string | null) {
  const { roles, userId } = useUser(({ state }) => ({
    roles: state.roles,
    userId: state.userId,
  }));

  return useMemo(() => {
    const hasUnrestrictedRole = MANAGE_ALL_RISK_ROLES.some((role) =>
      roles.includes(role),
    );
    const hasRiskOwnerRole = RISK_OWNER_GATED_ROLES.some((role) =>
      roles.includes(role),
    );
    const isRiskOwner =
      hasRiskOwnerRole && riskOwner?.toLowerCase() === userId.toLowerCase();

    return {
      canEditRisk: hasUnrestrictedRole || isRiskOwner,
      canDeleteRisk: hasUnrestrictedRole,
    };
  }, [roles, userId, riskOwner]);
}
