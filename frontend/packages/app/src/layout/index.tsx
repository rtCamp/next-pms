/**
 * External dependencies.
 */
import { Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorFallback } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import Sidebar from "@/layout/sidebar";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { setInitialData } from "@/store/user";
import { useUser } from "@/hooks/useUser";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const dispatch = useDispatch();
  const toast = useToasts();
  const { data, error } = useFrappeGetCall("next_pms.timesheet.api.employee.get_data", {}, undefined, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 1,
  });

  useEffect(() => {
    if (data) {
      const info = {
        employee: data.message?.employee ?? "",
        workingHours: data.message?.employee_working_detail?.working_hour ?? 8,
        workingFrequency: data.message?.employee_working_detail?.working_frequency ?? "Per Day",
        reportsTo: data.message?.employee_report_to ?? "",
        employeeName: data.message?.employee_name ?? "",
      };
      dispatch(setInitialData(info));
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err);
    }
  }, [data, error]);

  return (
    <ErrorFallback>
      <div className="flex flex-row h-screen w-full">
        <ErrorFallback>
          <Sidebar />
        </ErrorFallback>
        <div className="w-full overflow-hidden flex flex-col">
          {(user.employee || user.user == "Administrator") && (
            <>
              <Suspense fallback={<></>}>
                <ErrorFallback>{children}</ErrorFallback>
              </Suspense>
            </>
          )}
        </div>
      </div>
    </ErrorFallback>
  );
};

export default Layout;
