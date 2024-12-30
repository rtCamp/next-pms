/**
 * External dependencies.
 */
import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { Toaster } from "@/app/components/ui/toaster";
import { useToast } from "@/app/components/ui/use-toast";
import Sidebar from "@/app/layout/sidebar";
import { checkScreenSize, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { updateScreenSize } from "@/store/app";
import { setInitialData } from "@/store/user";

const GenWrapper = lazy(() => import("@/app/components/GenWrapper"));

const Layout = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { data, error } = useFrappeGetCall("next_pms.timesheet.api.employee.get_data", {}, undefined, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
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
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  const screenSize = useSelector((state: RootState) => state.app.screenSize);
  const handleScreenSize = () => {
    dispatch(updateScreenSize(checkScreenSize()));
  };

  useEffect(() => {
    window.addEventListener("resize", handleScreenSize);
    () => {
      window.removeEventListener("resize", handleScreenSize);
    };
  }, []);

  return (
    <GenWrapper>
      <div className="flex flex-row h-screen w-full">
        <GenWrapper>
          <Sidebar />
        </GenWrapper>
        <div
          className="w-full overflow-hidden"
          style={{
            width: `${screenSize === "sm" || screenSize === "md" ? "calc(100% - 64px)" : "100%"}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {(user.employee || user.user == "Administrator") && (
            <>
              <Suspense fallback={<></>}>
                <GenWrapper>{children}</GenWrapper>
              </Suspense>
            </>
          )}
        </div>
      </div>
      <Toaster />
    </GenWrapper>
  );
};

export default Layout;
