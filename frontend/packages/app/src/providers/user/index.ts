/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { ROLES } from "@/lib/constant";
import { getLocalStorage } from "@/lib/storage";
import { getCookie } from "@/lib/utils";
import { WorkingFrequency } from "@/types";

export interface UserContextProps {
  state: {
    /** Indicates whether user/auth data is still being resolved. */
    isLoading: boolean;
    /** Employee record ID linked to the current user. */
    employeeId: string;
    /** Display name of the current employee. */
    employeeName: string;
    /** Configured working hours for the employee. */
    workingHours: number;
    /** Frequency used to interpret configured working hours. */
    workingFrequency: WorkingFrequency;
    /** Employee ID of the reporting manager. */
    reportsTo: string;
    /** Authenticated user identifier returned by Frappe auth. */
    currentUser: string | null | undefined;
    /** System user ID from cookies/session state. */
    userId: string;
    /** Full name of the logged-in user. */
    userName: string;
    /** Profile image URL for the logged-in user. */
    image: string;
    /** Whether the main sidebar is currently collapsed. */
    isSidebarCollapsed: boolean;
    /** Roles assigned to the logged-in user. */
    roles: string[];
    /** Whether the current user has role-based access to restricted views. */
    hasRoleAccess: boolean;
    /** Currency options available to the user in boot data. */
    currencies: Array<string>;
    /** Whether the business unit field is enabled in the system. */
    hasBuField: boolean;
    /** Whether the industry field is enabled in the system. */
    hasIndustryField: boolean;
  };
  actions: {
    /** Logs out the current user and clears the active session. */
    logout: () => Promise<void>;
    /** Updates and persists the sidebar collapsed state. */
    updateIsSidebarCollapsed: (state: boolean) => void;
  };
}

export const UserContext = createContext<UserContextProps>({
  state: {
    isLoading: false,
    employeeId: "",
    employeeName: "",
    workingHours: 0,
    workingFrequency: "Per Day",
    reportsTo: "",
    currentUser: "",
    userId: decodeURIComponent(getCookie("user_id") ?? ""),
    userName: decodeURIComponent(getCookie("full_name") ?? ""),
    image: decodeURIComponent(getCookie("user_image") ?? ""),
    isSidebarCollapsed: getLocalStorage("next-pms:isSidebarCollapsed", false),
    roles: window.frappe?.boot?.user?.roles ?? [],
    hasRoleAccess: (window.frappe?.boot?.user?.roles ?? []).some((role) =>
      ROLES.includes(role),
    ),
    currencies: window.frappe?.boot?.currencies ?? [],
    hasBuField: window.frappe?.boot?.has_business_unit ?? false,
    hasIndustryField: window.frappe?.boot?.has_industry ?? false,
  },
  actions: {
    logout: () => Promise.resolve(),
    updateIsSidebarCollapsed: () => null,
  },
});

export const useUser = <T>(
  selector: (state: UserContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(UserContext, selector);
};
