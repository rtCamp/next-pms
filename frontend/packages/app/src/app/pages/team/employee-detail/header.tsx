/**
 * External dependencies
 */
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFrappeGetCall } from "frappe-react-sdk";
/**
 * Internal dependencies
 */
import AddTime from "@/app/components/add-time";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { Header } from "@/app/layout/root";
import { RootState } from "@/store";
import type { EmployeeDetailHeaderProps } from "./types";
import { EditTime } from "../../timesheet/components/editTime";
import { Approval } from "../components/approval";

export const EmployeeDetailHeader = ({ state, dispatch, callback, employeeId }: EmployeeDetailHeaderProps) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const { data: employee } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee",
    {
      filters: { name: employeeId },
    },
    "employeedetail/header/" + employeeId,
    {
      errorRetryCount: 1,
      revalidateOnFocus: true,
      revalidateIfStale: false,
    }
  );

  const onEmployeeChange = (name: string) => {
    navigate(`/team/employee/${name}`);
  };

  return (
    <>
      <Header>
        <EmployeeCombo
          employeeName={employee?.message?.employee_name}
          onSelect={onEmployeeChange}
          pageLength={20}
          value={employeeId as string}
          className="w-full lg:w-fit"
          ignoreDefaultFilters={true}
        />
      </Header>
      {state.isAprrovalDialogOpen && (
        <Approval
          employee={state.employee}
          isAprrovalDialogOpen={state.isAprrovalDialogOpen}
          endDate={state.dateRange.endDate}
          startDate={state.dateRange.startDate}
          onClose={(data: string) => {
            dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: data });
            dispatch({
              type: "SET_DATE_RANGE",
              payload: { dateRange: { startDate: "", endDate: "" }, isAprrovalDialogOpen: false },
            });
            callback();
          }}
        />
      )}
      {state.isDialogOpen && (
        <AddTime
          open={state.isDialogOpen}
          onOpenChange={(data) => {
            dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: data.date });
            callback();
            dispatch({ type: "SET_DIALOG", payload: false });
          }}
          onSuccess={(data) => {
            dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: data.date });
            callback();
          }}
          task={state.timesheet.task}
          initialDate={state.timesheet.date}
          employee={state.employee}
          workingFrequency={state.timesheetData.working_frequency}
          workingHours={state.timesheetData.working_hour}
          project={state.timesheet.project}
          employeeName={employee?.message?.employee_name}
        />
      )}
      {state.isEditDialogOpen && (
        <EditTime
          open={state.isEditDialogOpen}
          employee={state.employee}
          date={state.timesheet.date}
          task={state.timesheet.task}
          user={user}
          onClose={() => {
            dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: state.timesheet.date });
            dispatch({ type: "SET_EDIT_DIALOG", payload: false });
            callback();
          }}
        />
      )}
    </>
  );
};
