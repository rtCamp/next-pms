import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { UserContext } from "@/app/provider/UserProvider";
import { Layout } from "@/app/components/layout/layout";
import { ScreenLoader } from "@/app/components/Loader";
import { useDispatch } from "react-redux";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { setRole } from "@/app/state/roles";

export const AuthenticatedRoute = () => {
  const { currentUser, isLoading, logout } = useContext(UserContext);
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
    return <ScreenLoader isFullPage={true} />;
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
  const { logout } = useContext(UserContext);
  const roles = useSelector((state: RootState) => state.roles);
  if (!roles.value.includes("Projects Manager")) {
    logout();
  }
  return <Outlet />;
};
