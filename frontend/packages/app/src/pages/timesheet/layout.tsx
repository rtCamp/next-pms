/**
 * External dependencies.
 */
import { Breadcrumbs, Button, Folder, People, Time } from "@rtcamp/frappe-ui-react";
import { CalendarX2, ChevronDown, Plus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useReducer } from "react";
import { getUTCDateTime, getFormatedDate } from "@next-pms/design-system/date";
import { useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/root";
import { initialState, reducer } from "@/pages/timesheet/reducer";
import { RootState } from "@/store";

const timesheetViews = [
  { key: "personal", label: "Personal", to: "/timesheet/personal", icon: Time },
  { key: "team", label: "Team", to: "/timesheet/team", icon: People },
  { key: "project", label: "Project", to: "/timesheet/project", icon: Folder },
] as const;

function TimesheetLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.user);

  const [_, dispatch] = useReducer(reducer, initialState);

  const selectedKey = pathname.includes("team") ? "team" : pathname.includes("project") ? "project" : "personal";

  const activeView = timesheetViews.find((v) => v.key === selectedKey)!;

  const handleAddTimeOff = () => {
    dispatch({ type: "SET_TIME_OFF_DIALOG_STATE", payload: true });
  };

  const handleAddTime = () => {
    const timesheetData = {
      name: "",
      task: "",
      date: getFormatedDate(getUTCDateTime()),
      description: "",
      hours: 0,
      employee: user.employee,
      project: "",
    };
    dispatch({ type: "SET_TIMESHEET", payload: timesheetData });
    dispatch({ type: "SET_DIALOG_STATE", payload: true });
  };

  return (
    <div>
      <Header className="justify-between">
        <Breadcrumbs
          items={[
            {
              id: "timesheets",
              label: "Timesheets",
            },
            {
              id: "personal",
              label: activeView.label,
              prefixIcon: <activeView.icon className="size-4" />,
              suffixIcon: <ChevronDown className="w-4 h-4" />,
              dropdown: {
                dropdownClassName: "w-[220px] px-1",
                groupClassName: "px-0 py-1 space-y-1",
                itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                selectedKey: selectedKey,
                selectedGroupKey: "views-group",
                options: [
                  {
                    group: "",
                    key: "views-group",
                    items: timesheetViews.map((v) => ({
                      label: v.label,
                      key: v.key,
                      icon: <v.icon className="size-4 mr-2" />,
                      onClick: () => navigate(v.to),
                    })),
                  },
                ],
              },
            },
          ]}
        />
        <div className="flex gap-2">
          {window.frappe?.boot?.user?.can_create.includes("Leave Application") && (
            <Button onClick={handleAddTimeOff} label="Add time-off" iconLeft={() => <CalendarX2 />} />
          )}

          <Button variant="solid" onClick={handleAddTime} label="Add time" iconLeft={() => <Plus />} />
        </div>
      </Header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default TimesheetLayout;
