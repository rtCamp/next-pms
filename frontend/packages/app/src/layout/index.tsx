/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import Sidebar from "@/layout/sidebar";
import { NotificationsProvider } from "@/providers/notifications/provider";
import { useUser } from "@/providers/user";
import type { Role } from "@/types";

const NOTIFICATION_ROLES: Role[] = [
  "Delivery Manager",
  "Delivery User",
  "Projects Manager",
  "Projects User",
];

const LayoutWithSidebar = () => {
  const { employeeId, roles } = useUser(({ state }) => ({
    employeeId: state.employeeId,
    roles: state.roles,
  }));

  const canReceiveNotifications = roles.some((r) =>
    NOTIFICATION_ROLES.includes(r),
  );

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
