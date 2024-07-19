import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Router } from "@/route";
import { Toaster } from "@/app/components/ui/toaster";
import { Suspense, useContext, useEffect } from "react";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { setEmployee } from "@/store/user";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";

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
    })();
  }, []);
  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar />
      <div className="w-full flex flex-col">
        <Header />
        {user.employee && (
          <div className="h-full p-5">
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
