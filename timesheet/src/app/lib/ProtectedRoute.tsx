import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { UserContext } from "@/app/provider/UserProvider";
import { Layout } from "@/app/components/layout/layout";
import { ScreenLoader } from "@/app/components/Loader";
export const ProtectedRoute = () => {
  const { currentUser, isLoading } = useContext(UserContext);
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
