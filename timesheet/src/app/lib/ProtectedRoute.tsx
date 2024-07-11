import { useContext, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { UserContext } from "@/app/provider/UserProvider";
import { Layout } from "@/app/components/layout/layout";
import { useDispatch } from "react-redux";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { setRole } from "@/app/state/roles";
import { useFrappeGetCall } from "frappe-react-sdk";

export const AuthenticatedRoute = () => {
  const { currentUser, isLoading } = useContext(UserContext);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const roles = useSelector((state: RootState) => state.roles);
  const dispatch = useDispatch();

  if (roles.value.length < 1) {
    call
      .get("timesheet_enhancer.api.utils.get_current_user_roles")
      .then((res) => {
        dispatch(setRole(res.message));
      });
  }
  if (isLoading) {
    return <></>;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/timesheet");
  }
  if (!isLoading && currentUser && currentUser !== "Guest") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }
};

export const OnlyPMRoute = () => {
  const roles = useSelector((state: RootState) => state.roles);
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
    if (roles.value.length < 1 && !isLoading && !error) {
      dispatch(setRole(data.message));
    }
  }, [roles.value]);

  if (!roles.value.includes("Projects Manager")) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
};
