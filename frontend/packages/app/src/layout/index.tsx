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
import { useUser } from "@/providers/user";

const LayoutWithSidebar = () => {
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  return (
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
};

export default LayoutWithSidebar;
