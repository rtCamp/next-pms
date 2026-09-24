/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Outlet } from "react-router";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import Sidebar from "@/layout/sidebar";
import { ROLE_ACCESS } from "@/lib/constant";
import { hasAnyRole } from "@/lib/utils";
import { NotificationsProvider } from "@/providers/notifications/provider";
import { useUser } from "@/providers/user";

const LayoutWithSidebar = () => {
  const { employeeId, roles } = useUser(({ state }) => ({
    employeeId: state.employeeId,
    roles: state.roles,
  }));

  const canReceiveNotifications = hasAnyRole(roles, ROLE_ACCESS.notifications);

  const layout = (
    <ErrorFallback>
      {Boolean(employeeId) && (
        <div className="flex flex-row h-screen w-full">
          <ErrorFallback>
            <Sidebar />
          </ErrorFallback>
          <div className="w-full overflow-hidden flex flex-col">
            <Suspense fallback={<></>}>
              <ErrorFallback>
                <Outlet />
              </ErrorFallback>
            </Suspense>
          </div>
        </div>
      )}
    </ErrorFallback>
  );

  return canReceiveNotifications ? (
    <NotificationsProvider>{layout}</NotificationsProvider>
  ) : (
    layout
  );
};

export default LayoutWithSidebar;
