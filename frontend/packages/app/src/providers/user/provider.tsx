/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROLES } from "@/lib/constant";
import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import { getCookie } from "@/lib/utils";
import { UserContext, type UserContextProps } from ".";

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const [employeeId, setEmployeeId] =
    useState<UserContextProps["state"]["employeeId"]>("");
  const [employeeName, setEmployeeName] =
    useState<UserContextProps["state"]["employeeName"]>("");
  const [workingHours, setWorkingHours] =
    useState<UserContextProps["state"]["workingHours"]>(0);
  const [workingFrequency, setWorkingFrequency] =
    useState<UserContextProps["state"]["workingFrequency"]>("Per Day");
  const [reportsTo, setReportsTo] =
    useState<UserContextProps["state"]["reportsTo"]>("");

  const userId: UserContextProps["state"]["userId"] = decodeURIComponent(
    getCookie("user_id") ?? "",
  );
  const userName: UserContextProps["state"]["userName"] = decodeURIComponent(
    getCookie("full_name") ?? "",
  );
  const image: UserContextProps["state"]["image"] = decodeURIComponent(
    getCookie("userImage") ?? "",
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<
    UserContextProps["state"]["isSidebarCollapsed"]
  >(getLocalStorage("next-pms:isSidebarCollapsed", false));
  const [roles, setRoles] = useState<UserContextProps["state"]["roles"]>(
    window.frappe?.boot?.user?.roles || [],
  );
  const [currencies, setCurrencies] = useState<
    UserContextProps["state"]["currencies"]
  >(window.frappe?.boot?.currencies || []);
  const [hasBuField, setHasBuField] = useState<
    UserContextProps["state"]["hasBuField"]
  >(window.frappe?.boot?.has_business_unit || false);
  const [hasIndustryField, setHasIndustryField] = useState<
    UserContextProps["state"]["hasIndustryField"]
  >(window.frappe?.boot?.has_industry || false);
  const hasRoleAccess = roles.some((role) => ROLES.includes(role));

  const isAdministrator = userId == "Administrator";

  const { logout, isLoading: isAuthLoading, currentUser } = useFrappeAuth();

  const { isLoading: isAppDataLoading, data: appData } = useFrappeGetCall(
    "next_pms.timesheet.api.app.get_data",
  );

  useEffect(() => {
    setRoles(appData?.message?.roles || []);
    setCurrencies(appData?.message?.currencies || []);
    setHasBuField(appData?.message?.has_business_unit || false);
    setHasIndustryField(appData?.message?.has_industry || false);
  }, [appData]);

  const { isLoading: isEmployeeDataLoading, data: employeeData } =
    useFrappeGetCall("next_pms.timesheet.api.employee.get_data");

  // Determine if there is an error in fetching necessary data for the user context.
  const hasError =
    (!isAppDataLoading && !appData) ||
    (!isAdministrator &&
      !isEmployeeDataLoading &&
      !employeeData?.message?.employee);

  useEffect(() => {
    setEmployeeId(employeeData?.message?.employee ?? "");
    setWorkingHours(
      employeeData?.message?.employee_working_detail?.working_hour ?? 8,
    );
    setWorkingFrequency(
      employeeData?.message?.employee_working_detail?.working_frequency ??
        "Per Day",
    );
    setReportsTo(employeeData?.message?.employee_report_to ?? "");
    setEmployeeName(employeeData?.message?.employee_name ?? "");
  }, [employeeData]);

  /**
   * Updates the sidebar collapsed state and persists it to local storage.
   * @param state - Boolean indicating if sidebar should be collapsed
   */
  const updateIsSidebarCollapsed = (state: boolean) => {
    setIsSidebarCollapsed(state);
    setLocalStorage("next-pms:isSidebarCollapsed", state);
  };

  /**
   * Handles user logout by calling the logout function and redirecting to the login page.
   */
  const handleLogout = async () => {
    return logout().then(() => {
      window.location.replace("/login?redirect-to=/timesheet");
      window.location.reload();
    });
  };

  return (
    <UserContext.Provider
      value={{
        state: {
          isLoading: isAuthLoading,
          hasError,
          employeeId,
          employeeName,
          workingHours,
          workingFrequency,
          reportsTo,
          userId,
          userName,
          image,
          isSidebarCollapsed,
          roles,
          hasRoleAccess,
          currencies,
          hasBuField,
          hasIndustryField,
          currentUser,
        },
        actions: {
          logout: handleLogout,
          updateIsSidebarCollapsed,
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
