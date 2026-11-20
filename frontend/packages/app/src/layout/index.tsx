/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Outlet } from "react-router";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useCapability } from "@/hooks/useCapability";
import Sidebar from "@/layout/sidebar";
import { NotificationsProvider } from "@/providers/notifications/provider";
import { useUser } from "@/providers/user";

const LayoutWithSidebar = () => {
  const employeeId = useUser(({ state }) => state.employeeId);
  const canReceiveNotifications = useCapability("notifications");

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
