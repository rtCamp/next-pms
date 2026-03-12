/**
 * External dependencies.
 */
import { Breadcrumbs, Button, Folder, People, Time } from "@rtcamp/frappe-ui-react";
import { CalendarX2, ChevronDown, Plus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/root";
import { RootState } from "@/store";
import AddTime from "@/components/add-time";
import AddLeave from "@/components/add-leave";
import { getTodayDate } from "@next-pms/design-system";

const timesheetViews = [
  { key: "personal", label: "Personal", to: "/timesheet/personal", icon: Time },
  { key: "team", label: "Team", to: "/timesheet/team", icon: People },
  { key: "project", label: "Project", to: "/timesheet/project", icon: Folder },
] as const;

function TimesheetLayout() {
  const navigate = useNavigate();
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.user);

  const selectedKey = pathname.includes("team") ? "team" : pathname.includes("project") ? "project" : "personal";

  const activeView = timesheetViews.find((v) => v.key === selectedKey)!;

  return (
    <div className="h-screen">
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
            <Button onClick={() => setIsLeaveDialogOpen(true)} label="Add time-off" iconLeft={() => <CalendarX2 />} />
          )}

          <Button
            variant="solid"
            onClick={() => setIsTimeDialogOpen(true)}
            label="Add time"
            iconLeft={() => <Plus />}
          />
        </div>
      </Header>
      <Outlet />
      <AddTime
        initialDate={getTodayDate()}
        employee={user.employee}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
      />
      <AddLeave
        employee={user.employee}
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
      />
    </div>
  );
}

export default TimesheetLayout;
