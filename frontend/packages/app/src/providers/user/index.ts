/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { getLocalStorage } from "@/lib/storage";
import { getCookie } from "@/lib/utils";
import { WorkingFrequency } from "@/types";

export interface UserContextProps {
  state: {
    isLoading: boolean;
    employeeId: string;
    employeeName: string;
    workingHours: number;
    workingFrequency: WorkingFrequency;
    reportsTo: string;
    currentUser: string | null | undefined;
    userId: string;
    userName: string;
    image: string;
    isSidebarCollapsed: boolean;
    roles: string[];
    currencies: Array<string>;
    hasBuField: boolean;
    hasIndustryField: boolean;
  };
  actions: {
    logout: () => Promise<void>;
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
    isSidebarCollapsed: getLocalStorage("next-pms:isSidebarCollapsed") || false,
    roles: window.frappe?.boot?.user?.roles ?? [],
    currencies: window.frappe?.boot?.currencies ?? [],
    hasBuField: window.frappe?.boot?.has_business_unit ?? false,
    hasIndustryField: window.frappe?.boot?.has_industry ?? false,
  },
  actions: {
    logout: () => Promise.resolve(),
    updateIsSidebarCollapsed: () => null,
  },
});

export const useUserState = () => {
  return useContextSelector(UserContext, (value) => value.state);
};

export const useUserActions = () => {
  return useContextSelector(UserContext, (value) => value.actions);
};
