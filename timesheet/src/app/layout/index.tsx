import Sidebar from "./sidebar";
import { Toaster } from "@/app/components/ui/toaster";
import { Suspense, useContext, useEffect } from "react";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { setEmployee } from "@/store/user";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/app/components/ui/use-toast";
import { checkScreenSize, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { Navigate, Outlet } from "react-router-dom";
import { TIMESHEET } from "@/lib/constant";
import GenWrapper from "../components/GenWrapper";
import { updateScreenSize } from "@/store/app";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  useEffect(() => {
    (async () => {
      call
        .get("timesheet_enhancer.api.utils.get_employee_from_user")
        .then((res) => {
          dispatch(setEmployee(res?.message));
        })
        .catch((err) => {
          const error = parseFrappeErrorMsg(err);
          toast({
            variant: "destructive",
            description: error,
          });
        });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const screenSize = useSelector((state: RootState) => state.app.screenSize);
  const handleScreenSize = () => {
    dispatch(updateScreenSize(checkScreenSize()));
  };
  useEffect(() => {
    window.addEventListener("resize", handleScreenSize);
    () => {
      // cleanups
      window.removeEventListener("resize", handleScreenSize);
    };
  }, []);

  return (
    <GenWrapper>
      <div className="flex flex-row h-screen w-screen">
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
          {user.employee && (
            <div className="h-full p-3">
              <Suspense fallback={<></>}>
                <GenWrapper>{children}</GenWrapper>
              </Suspense>
              <Toaster />
            </div>
          )}
        </div>
      </div>
    </GenWrapper>
  );
};

export const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);

  if (!user.roles.includes("Projects Manager") && !user.roles.includes("Timesheet Manager")) {
    return <Navigate to={TIMESHEET} />;
  }
  return <Outlet />;
};
