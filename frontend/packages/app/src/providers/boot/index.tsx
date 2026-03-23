/**
 * External dependencies
 */
import { PropsWithChildren, FC, useState, useEffect } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import { BootProviderContext } from "./context";
import { type BootProviderState } from "./type";

const BootProvider: FC<PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<BootProviderState["user"]["roles"]>(
    window.frappe?.boot?.user?.roles || [],
  );
  const [currencies, setCurrencies] = useState<BootProviderState["currencies"]>(
    window.frappe?.boot?.currencies || [],
  );
  const [hasBusinessUnit, setHasBusinessUnit] = useState<
    BootProviderState["hasBusinessUnit"]
  >(window.frappe?.boot?.has_business_unit || false);
  const [hasIndustry, setHasIndustry] = useState<
    BootProviderState["hasIndustry"]
  >(window.frappe?.boot?.has_industry || false);

  const { data: appData } = useFrappeGetCall(
    "next_pms.timesheet.api.app.get_data",
  );

  useEffect(() => {
    setRoles(appData?.message?.roles || []);
    setCurrencies(appData?.message?.currencies || []);
    setHasBusinessUnit(appData?.message?.has_business_unit || false);
    setHasIndustry(appData?.message?.has_industry || false);
  }, [appData]);

  console.log("boot Provider");
  

  return (
    <BootProviderContext.Provider
      value={{
        user: {
          roles,
          canCreate: window.frappe?.boot?.user?.can_create ?? [],
          canExport: window.frappe?.boot?.user?.can_export ?? [],
        },
        currencies,
        hasBusinessUnit,
        hasIndustry,
        deskTheme: window.frappe?.boot?.desk_theme,
        isCalendarSetup: window.frappe?.boot?.is_calendar_setup ?? false,
        globalFilters: window.frappe?.boot?.global_filters ?? {},
      }}
    >
      {children}
    </BootProviderContext.Provider>
  );
};

export default BootProvider;
