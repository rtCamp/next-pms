import React, { useContext, useEffect } from "react";
import { Header } from "@/app/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";
import { setEmployee } from "@/app/state/employee";
import { AppDispatch } from "@/app/state/store";
import { useDispatch } from "react-redux";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/app/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const employee = useSelector((state: RootState) => state.employee);
  const dispatch = useDispatch<AppDispatch>();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { toast } = useToast();
  useEffect(() => {
    (async () => {
      call
        .get("timesheet_enhancer.api.utils.get_employee_from_user")
        .then((res) => {
          dispatch(setEmployee(res?.message));
        })
        .catch((err) => {
          const error = parseFrappeErrorMsg(err._server_messages);
          toast({
            variant: "destructive",
            title: "Error! Something went wrong.",
            description: error.message ?? error,
          });
        });
    })();
  }, []);

  return (
    <div>
      <Header />
      <div className="lg:max-w-screen-lg lg:mr-auto lg:ml-auto md:pr-5 md:pl-5 pl-2 pr-3 xl:pr-0 xl:pl-0 pt-4">
        {employee.value && children}
      </div>
      <Toaster />
    </div>
  );
}
