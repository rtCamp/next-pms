import { Sidebar } from "./sidebar";
import { Router } from "@/route";
import { Toaster } from "@/app/components/ui/toaster";
import { Suspense, useContext, useEffect } from "react";
import { FrappeConfig, FrappeContext, useFrappeGetCall } from "frappe-react-sdk";
import { setEmployee, setRole } from "@/store/user";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { Navigate, Outlet } from "react-router-dom";
import { TIMESHEET } from "@/lib/constant";
export const Layout = () => {
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

      call
        .get("timesheet_enhancer.api.utils.get_current_user_roles")
        .then((res) => {
          dispatch(setRole(res?.message));
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
  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar />
      <div className="w-full flex flex-col">
        {user.employee && (
          <div className="h-full p-3">
            <Suspense fallback={<></>}>
              <Router />
            </Suspense>
            <Toaster />
          </div>
        )}
      </div>
    </div>
  );
};

export const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { data, isLoading, error } = useFrappeGetCall(
    "timesheet_enhancer.api.utils.get_current_user_roles",
    {},
    "roles",
    {
      refreshInterval: 600000,
    }
  );

  useEffect(() => {
    if (user.roles.length < 1 && !isLoading && !error) {
      dispatch(setRole(data.message));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, isLoading]);

  if (!user.roles.includes("Projects Manager")) {
    return <Navigate to={TIMESHEET} />;
  }
  return <Outlet />;
};
