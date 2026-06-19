/**
 * External dependencies.
 */
import { Navigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useUser } from "@/providers/user";

function Dashboard() {
  const { roles } = useUser(({ state }) => ({ roles: state.roles }));

  if (roles.includes("Delivery Manager")) {
    return <Navigate to={ROUTES["dashboard-leadership"]} replace />;
  }
  if (roles.includes("Projects Manager")) {
    return <Navigate to={ROUTES["dashboard-manager"]} replace />;
  }
  return <Navigate to={ROUTES.home} replace />;
}

export default Dashboard;
