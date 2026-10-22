import {
  computed,
  reactive,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { useCall } from "frappe-ui";

interface ProjectEmployeeAccess {
  has_any_member: boolean;
  has_any_project: boolean;
  is_valid: boolean;
}

type AccessParams = { project?: string; employee?: string };

export interface ProjectEmployeeAccessOptions {
  projectId: MaybeRefOrGetter<string>;
  employeeId: MaybeRefOrGetter<string>;
  /** Check only while this is true, e.g. while a dialog is open. */
  enabled: MaybeRefOrGetter<boolean>;
}

/**
 * Whether a project has any team member, whether an employee is on any project's team,
 * and whether the employee is on this project's team, in one cheap call
 * (`get_project_employee_access`). Checks again whenever either id changes.
 */
export function useProjectEmployeeAccess(
  options: ProjectEmployeeAccessOptions,
) {
  const call = useCall<ProjectEmployeeAccess, AccessParams>({
    url: "/api/v2/method/next_pms.timesheet.api.project.get_project_employee_access",
    immediate: false,
  });
  /** The answer and the pair it is for. */
  const answer = shallowRef<{
    key: string;
    access: ProjectEmployeeAccess;
  } | null>(null);

  const params = computed<AccessParams>(() => ({
    project: toValue(options.projectId) || undefined,
    employee: toValue(options.employeeId) || undefined,
  }));
  const key = computed(() => JSON.stringify(params.value));
  const active = computed(
    () =>
      toValue(options.enabled) &&
      Boolean(params.value.project || params.value.employee),
  );

  async function check() {
    if (!active.value) return;
    const requestKey = key.value;
    const access = await call.submit(params.value).catch(() => null);
    if (access && requestKey === key.value) {
      answer.value = { key: requestKey, access };
    }
  }

  watch([active, key], check, { immediate: true });

  const current = computed(() =>
    answer.value?.key === key.value ? answer.value.access : null,
  );

  return reactive({
    hasAnyMember: computed(() => current.value?.has_any_member ?? false),
    hasAnyProject: computed(() => current.value?.has_any_project ?? false),
    isValid: computed(() => current.value?.is_valid ?? false),
    /** The check has answered for the current pair. */
    hasAnswer: computed(() => current.value !== null),
    loading: computed(() => call.loading),
    retry: check,
  });
}
