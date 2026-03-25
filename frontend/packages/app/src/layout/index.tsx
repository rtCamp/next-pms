/**
 * External dependencies.
 */
import { Suspense } from "react";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import Sidebar from "@/layout/sidebar";
import { useUser } from "@/providers/user";

const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const { employeeId, userId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
    userId: state.userId,
  }));

  return (
    <ErrorFallback>
      <div className="flex flex-row h-screen w-full">
        <ErrorFallback>
          <Sidebar />
        </ErrorFallback>
        <div className="w-full overflow-hidden flex flex-col">
          {(employeeId || userId == "Administrator") && (
            <>
              <Suspense fallback={<></>}>
                <ErrorFallback>{children}</ErrorFallback>
              </Suspense>
            </>
          )}
        </div>
      </div>
    </ErrorFallback>
  );
};

export default LayoutWithSidebar;
