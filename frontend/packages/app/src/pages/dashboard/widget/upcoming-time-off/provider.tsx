/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";
import { useCallback, useMemo } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { UpcomingTimeOffContext } from "./context";
import { sortOpenLeavesFirst } from "./utils";
import type { EmployeesOnLeaveResponse } from "../../types";

export function UpcomingTimeOffProvider({ children }: PropsWithChildren) {
  const toast = useToasts();
  const { data, isLoading, mutate } =
    useFrappeGetCall<EmployeesOnLeaveResponse>(
      "next_pms.api.dashboard.get_employees_on_leave",
    );
  const { call: approveLeaveApplication } = useFrappePostCall(
    "next_pms.api.dashboard.approve_leave_application",
  );

  const approveLeave = useCallback(
    async (name: string) => {
      try {
        await approveLeaveApplication({ name });
        toast.success("Leave application approved");
        await mutate();
      } catch (error) {
        toast.error(parseFrappeErrorMsg(error as FrappeError));
      }
    },
    [approveLeaveApplication, mutate, toast],
  );

  const value = useMemo(() => {
    const leaves = sortOpenLeavesFirst(data?.message ?? []);
    return {
      leaves,
      pendingCount: leaves.filter((leave) => leave.status === "Open").length,
      isLoading,
      approveLeave,
    };
  }, [data, isLoading, approveLeave]);

  return (
    <UpcomingTimeOffContext.Provider value={value}>
      {children}
    </UpcomingTimeOffContext.Provider>
  );
}
