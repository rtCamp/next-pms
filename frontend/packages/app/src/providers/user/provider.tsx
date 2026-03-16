/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useContext, useEffect, useState } from "react";
import { FrappeConfig, FrappeContext, useFrappeAuth } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
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
  const [userId, setUserId] = useState<UserContextProps["state"]["userId"]>(
    decodeURIComponent(getCookie("user_id") ?? ""),
  );
  const [userName, setUserName] = useState<
    UserContextProps["state"]["userName"]
  >(decodeURIComponent(getCookie("full_name") ?? ""));
  const [image, setImage] = useState<UserContextProps["state"]["image"]>(
    decodeURIComponent(getCookie("user_image") ?? ""),
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<
    UserContextProps["state"]["isSidebarCollapsed"]
  >(getLocalStorage("next-pms:isSidebarCollapsed") || false);
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

  const { logout, isLoading, currentUser } = useFrappeAuth();
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const populateData = async () => {
    if (roles.length < 1) {
      try {
        const res = await call.get("next_pms.timesheet.api.app.get_data");
        setRoles(res.message.roles);
        setCurrencies(res.message.currencies);
        setHasBuField(res.message.has_business_unit);
        setHasIndustryField(res.message.has_industry);
      } catch (error) {}
    }
  };

  const populateEmployeeData = async () => {
    try {
      const res = await call.get("next_pms.timesheet.api.employee.get_data");
      setEmployeeId(res.message?.employee ?? "");
      setWorkingHours(res.message?.employee_working_detail?.working_hour ?? 8);
      setWorkingFrequency(
        res.message?.employee_working_detail?.working_frequency ?? "Per Day",
      );
      setReportsTo(res.message?.employee_report_to ?? "");
      setEmployeeName(res.message?.employee_name ?? "");
    } catch (error) {}
  };

  const updateIsSidebarCollapsed = (state: boolean) => {
    setIsSidebarCollapsed(state);
    setLocalStorage("next-pms:isSidebarCollapsed", state);
  };

  const handleLogout = async () => {
    return logout().then(() => {
      window.location.replace("/login?redirect-to=/timesheet");
      window.location.reload();
    });
  };

  useEffect(() => {
    populateEmployeeData();
    populateData();
  }, []);

  return (
    <UserContext.Provider
      value={{
        state: {
          isLoading,
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
