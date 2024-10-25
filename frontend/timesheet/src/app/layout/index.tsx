import Sidebar from "./sidebar";
import { Toaster } from "@/app/components/ui/toaster";
import { Suspense,  useEffect } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {ROLES} from "@/lib/constant";
import { setEmployee } from "@/store/user";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/app/components/ui/use-toast";
import { checkScreenSize, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { Navigate, Outlet } from "react-router-dom";
import { TIMESHEET } from "@/lib/constant";
import GenWrapper from "../components/GenWrapper";
import { updateScreenSize } from "@/store/app";
import { setWorkingDetail } from "@/store/user";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { data: workingDetail, error: workingError } = useFrappeGetCall(
    "frappe_pms.timesheet.api.employee.get_employee_working_hours",
    {},
    undefined,
    {
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );
  const { data: employeeUser, error } = useFrappeGetCall(
    "frappe_pms.timesheet.api.employee.get_employee_from_user",
    {},
    undefined,
    {
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );
  useEffect(() => {
    if (employeeUser) {
      if (employeeUser.message) {
        dispatch(setEmployee(employeeUser.message));
      } else {
        dispatch(setEmployee(""));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeUser, error]);

  useEffect(() => {
    if (workingDetail) {
      const data = {
        workingHours: workingDetail.message.working_hour,
        workingFrequency: workingDetail.message.working_frequency,
      };
      dispatch(setWorkingDetail(data));
    }
    if (workingError) {
      const error = parseFrappeErrorMsg(workingError);
      toast({
        variant: "destructive",
        description: error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingDetail, workingError]);

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

export const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);

  const hasAccess = user.roles.some(role => ROLES.includes(role));
  if (!hasAccess) {
    return <Navigate to={TIMESHEET} />;
  }
  return <Outlet />;
};
