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
  const { employeeId, hasError, userId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
    hasError: state.hasError,
    userId: state.userId,
  }));

  const canRenderOutlet =
    Boolean(employeeId) || (userId == "Administrator" && !hasError);

  return (
    <ErrorFallback>
      <div className="flex flex-row h-screen w-full">
        <ErrorFallback>
          <Sidebar />
        </ErrorFallback>
        <div className="w-full overflow-hidden flex flex-col">
          {canRenderOutlet && (
            <>
              <Suspense fallback={<></>}>
                <ErrorFallback>
                  <Outlet />
                </ErrorFallback>
              </Suspense>
            </>
          )}
          {!canRenderOutlet && hasError && (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-base text-ink-gray-6">Something went wrong.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorFallback>
  );
};

export default LayoutWithSidebar;
