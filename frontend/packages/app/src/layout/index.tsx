/**
 * External dependencies.
 */
import { Suspense } from "react";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import Sidebar from "@/layout/sidebar";
import { useUserState } from "@/providers/user";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { employeeId, userId } = useUserState();

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

export default Layout;
