/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

interface UseProjectEmployeeAccessOptions {
  projectId: string;
  employeeId: string;
  enabled: boolean;
}

interface ProjectEmployeeAccessResponse {
  message?: {
    has_any_member: boolean;
    has_any_project: boolean;
    is_valid: boolean;
  };
}

/**
 * Cheap existence-only check covering both directions of the project/employee
 * relationship in one call — avoids fetching a project's full member list or
 * an employee's full accessible-project set just to answer a few booleans.
 */
export function useProjectEmployeeAccess({
  projectId,
  employeeId,
  enabled,
}: UseProjectEmployeeAccessOptions) {
  const { data, isLoading } = useFrappeGetCall<ProjectEmployeeAccessResponse>(
    "next_pms.timesheet.api.project.get_project_employee_access",
    { project: projectId || undefined, employee: employeeId || undefined },
    enabled && (projectId || employeeId) ? undefined : null,
  );

  return {
    hasAnyMember: data?.message?.has_any_member ?? false,
    hasAnyProject: data?.message?.has_any_project ?? false,
    isValid: data?.message?.is_valid ?? false,
    isLoading,
  };
}
