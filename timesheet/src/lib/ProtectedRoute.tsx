import { useContext } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { UserContext } from "@/provider/UserProvider";

export const ProtectedRoute = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useContext(UserContext);
  if (isLoading) {
    // TODO: Add a loading spinner
  } else if (!currentUser || currentUser === "Guest") {
    navigate("/login?redirect-to=/timesheet");
    window.location.reload();
    return null;
  }
  return <Outlet />;
};
