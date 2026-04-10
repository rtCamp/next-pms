/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import {
  TeamTimesheetContext,
  type TeamTimesheetContextProps,
} from "./context";
import { useTeamTimesheetData } from "./useTeamTimesheetData";

export const TeamTimesheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToasts();
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(false);

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const { hasMoreWeeks, isLoadingTeamData, weekGroups, loadData, error } =
    useTeamTimesheetData({ employeeId });

  useEffect(() => {
    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [error]);

  const openWeeklyApproval = useCallback((employeeId: string, date: string) => {
    setEmployee(employeeId);
    setStartDate(date);
    setIsWeeklyApprovalOpen(true);
  }, []);

  const value: TeamTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks,
        isLoadingTeamData,
        weekGroups,
        isWeeklyApprovalOpen,
        employee,
        startDate,
      },
      actions: {
        loadData,
        openWeeklyApproval,
        setIsWeeklyApprovalOpen,
      },
    }),
    [
      hasMoreWeeks,
      isLoadingTeamData,
      loadData,
      weekGroups,
      openWeeklyApproval,
      employee,
      startDate,
      isWeeklyApprovalOpen,
    ],
  );

  return (
    <TeamTimesheetContext.Provider value={value}>
      {children}
    </TeamTimesheetContext.Provider>
  );
};
