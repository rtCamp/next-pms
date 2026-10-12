import { computed, reactive } from "vue";
import { useCall } from "frappe-ui";
import { redirectToLogin } from "../boot";
import { hasAnyRole } from "./roles";
import type { AppData, EmployeeData, Role } from "./types";

function cookie(name: string): string {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : "";
}

function createSession() {
  let loading: Promise<void> | undefined;
  const app = useCall<AppData>({
    url: "/api/v2/method/next_pms.timesheet.api.app.get_data",
    immediate: false,
  });
  const employee = useCall<EmployeeData>({
    url: "/api/v2/method/next_pms.timesheet.api.employee.get_data",
    immediate: false,
  });
  const logout = useCall<null>({
    url: "/api/v2/method/logout",
    method: "POST",
    immediate: false,
  });

  const roles = computed<Role[]>(
    () => app.data?.roles ?? window.boot?.user?.roles ?? [],
  );

  return reactive({
    userId: cookie("user_id"),
    userName: cookie("full_name"),
    userImage: cookie("user_image"),
    roles,
    employee: computed(() => employee.data?.employee ?? null),
    employeeName: computed(() => employee.data?.employee_name ?? ""),
    reportsTo: computed(() => employee.data?.employee_report_to ?? null),
    workingHours: computed(
      () => employee.data?.employee_working_detail.working_hour ?? 8,
    ),
    workingFrequency: computed(
      () =>
        employee.data?.employee_working_detail.working_frequency ?? "Per Day",
    ),
    currencies: computed(
      () => app.data?.currencies ?? window.boot?.currencies ?? [],
    ),
    hasBusinessUnit: computed(() => app.data?.has_business_unit ?? false),
    hasIndustry: computed(() => app.data?.has_industry ?? false),
    backdateRestrictedBefore: computed(
      () => app.data?.backdate_restricted_before ?? null,
    ),
    /** `null` until the employee lookup has answered. */
    hasEmployee: computed(() =>
      employee.data ? Boolean(employee.data.employee) : null,
    ),
    loading: computed(() => app.loading || employee.loading),
    error: computed(() => app.error ?? employee.error),

    /** Loads the user's roles and employee record; later calls reuse the first load. */
    load(): Promise<void> {
      loading ??= Promise.all([app.fetch(), employee.fetch()]).then(() => {
        // A failed load may be retried on the next navigation.
        if (app.error || employee.error) loading = undefined;
      });
      return loading;
    },
    hasAnyRole(allowed: readonly Role[]) {
      return hasAnyRole(roles.value, allowed);
    },
    async logout() {
      await logout.submit();
      redirectToLogin();
    },
  });
}

export type Session = ReturnType<typeof createSession>;

// One session for the whole app, created on first use, so components and the
// router guards share the same calls. useCall works outside a component: its
// fetch only ties itself to an effect scope when there is one.
let session: Session | undefined;

/** The signed-in user: identity, roles and employee record, shared app-wide. */
export function useSession(): Session {
  session ??= createSession();
  return session;
}
