/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { useCapability } from "@/hooks/useCapability";
import { useUser } from "@/providers/user";

export function useOwnerGatedPermissions(owner?: string | null) {
  const userId = useUser(({ state }) => state.userId);
  const canManageAll = useCapability("project_admin");
  const isProjectsPageUser = useCapability("projects_page");

  return useMemo(() => {
    const isOwner =
      isProjectsPageUser && owner?.toLowerCase() === userId.toLowerCase();

    return {
      canEdit: canManageAll || isOwner,
      canDelete: canManageAll,
    };
  }, [canManageAll, isProjectsPageUser, userId, owner]);
}
