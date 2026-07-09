/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

interface UseProjectTeamMemberIdsOptions {
  projectId: string;
  enabled: boolean;
}

interface ProjectSidebarMembersResponse {
  message?: {
    members?: { employee: string }[];
  };
}

/**
 * Resolves the complete employee-id set for a project's team via the project
 * sidebar endpoint (same source as the project "About" sidebar). Used to
 * validate "is this employee on the project's team" without relying on the
 * employee lookup dropdown's options, which are capped to a single page of
 * results and therefore an unsafe/incomplete source for a membership check.
 */
export function useProjectTeamMemberIds({
  projectId,
  enabled,
}: UseProjectTeamMemberIdsOptions) {
  const { data, isLoading } = useFrappeGetCall<ProjectSidebarMembersResponse>(
    "next_pms.next_projects.api.project.get_project_sidebar",
    { project: projectId },
    enabled && projectId ? undefined : null,
  );

  const memberIds = useMemo(
    () =>
      new Set((data?.message?.members ?? []).map((member) => member.employee)),
    [data],
  );

  return { memberIds, isLoading };
}
