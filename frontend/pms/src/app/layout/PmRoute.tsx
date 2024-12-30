/**
 * External dependencies.
 */

import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Internal dependencies.
 */

import { ROLES } from "@/lib/constant";
import { TIMESHEET } from "@/lib/constant";
import { RootState } from "@/store";

const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);
  const hasAccess = user.roles.some((role: string) => ROLES.includes(role));

  if (!hasAccess) {
    return <Navigate to={TIMESHEET} />;
  }

  return <Outlet />;
};

export default PmRoute;
